import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // 1. Pure ModelConfig Invocation Endpoint
  // Strictly calls the configured model (Gemini text/TTS or external/custom provider)
  app.post('/api/model/call', async (req, res) => {
    try {
      const { modelConfig, prompt, overrideSystemInstruction } = req.body;
      if (!modelConfig || !prompt) {
        res.status(400).json({ error: 'Both modelConfig and prompt are required.' });
        return;
      }

      const provider = modelConfig.provider || 'gemini';
      const modality = modelConfig.modality || 'text';
      const settings = modelConfig.settings || {};
      const systemInstruction = overrideSystemInstruction || settings.systemInstruction || undefined;

      // Support external OpenAI-compatible / Ollama / Custom HTTP models if configured by user
      if (provider !== 'gemini' && settings.endpointUrl) {
        try {
          const extRes = await fetch(settings.endpointUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(settings.customHeaders || {}),
            },
            body: JSON.stringify({
              model: modelConfig.modelId,
              messages: [
                ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
                { role: 'user', content: prompt },
              ],
              temperature: settings.temperature ?? 0.7,
            }),
          });
          if (!extRes.ok) {
            const errText = await extRes.text();
            throw new Error(`External model ${modelConfig.modelId} returned ${extRes.status}: ${errText}`);
          }
          const extData: any = await extRes.json();
          const replyText =
            extData.choices?.[0]?.message?.content ||
            extData.response ||
            extData.content?.[0]?.text ||
            JSON.stringify(extData);
          res.json({
            text: replyText,
            modelUsed: `${provider}:${modelConfig.modelId}`,
            modality: 'text',
          });
          return;
        } catch (extErr: any) {
          res.status(502).json({
            error: `External model call failed (${modelConfig.name}): ${extErr.message}`,
          });
          return;
        }
      }

      const ai = getGenAIClient();

      // Audio / TTS Modality (creates playable WAV audio asset)
      if (modality === 'audio-tts') {
        const ttsModel =
          modelConfig.modelId === 'gemini-3.8-flash-tts'
            ? 'gemini-3.8-flash-tts'
            : 'gemini-3.8-flash-lite-tts';

        const voice1 = settings.voiceName || 'Kore';
        const voice2 = settings.secondVoiceName || 'Puck';

        if (ttsModel === 'gemini-3.8-flash-tts' && settings.multiSpeaker) {
          // First generate a concise 2-speaker podcast script if the prompt isn't already formatted
          let scriptLines: { speaker: string; text: string }[] = [];
          try {
            const scriptRes = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: `Create a short, engaging 4-turn educational dialogue between two hosts named Alex and Sam based on this request:\n\n${prompt}\n\nFormat strictly as lines starting with "Alex: " or "Sam: ". Keep total length under 110 words.`,
            });
            const rawScript = scriptRes.text || '';
            const lines = rawScript
              .split('\n')
              .map((l) => l.trim())
              .filter((l) => l.startsWith('Alex:') || l.startsWith('Sam:'));
            if (lines.length >= 2) {
              scriptLines = lines.map((line) => {
                const isAlex = line.startsWith('Alex:');
                return {
                  speaker: isAlex ? 'Alex' : 'Sam',
                  text: line,
                };
              });
            }
          } catch {
            // Fallback script lines
          }

          if (scriptLines.length === 0) {
            scriptLines = [
              { speaker: 'Alex', text: `Alex: Welcome back to Learning Space! Today we are exploring ${prompt.slice(0, 120)}.` },
              { speaker: 'Sam', text: `Sam: That is right, |yeah| let us break down the core equations and key mental models step by step.` },
            ];
          }

          const ttsRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts: scriptLines.map((item) => ({
                  text: item.text,
                  speechMetadata: {
                    speaker: item.speaker,
                    style: item.speaker === 'Alex' ? 'Warm, clear educator' : 'Curious, analytical co-host',
                  },
                })) as any,
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: 'Alex',
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: voice1 } },
                    },
                    {
                      speaker: 'Sam',
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: voice2 } },
                    },
                  ],
                },
              },
            },
          });

          const base64Audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          const transcriptText = scriptLines.map((l) => l.text).join('\n\n');
          res.json({
            text: transcriptText,
            audioUrl: base64Audio ? `data:audio/wav;base64,${base64Audio}` : undefined,
            modelUsed: ttsModel,
            modality: 'audio-tts',
          });
          return;
        } else {
          // Single-speaker TTS
          const ttsRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: prompt.slice(0, 600),
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice1 },
                },
              },
            },
          });

          const base64Audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          res.json({
            text: prompt,
            audioUrl: base64Audio ? `data:audio/wav;base64,${base64Audio}` : undefined,
            modelUsed: 'gemini-3.8-flash-lite-tts',
            modality: 'audio-tts',
          });
          return;
        }
      }

      // Text / Reasoning Generation
      // Map known aliases or external demo IDs cleanly to supported Gemini 3.8 / 3.1 models if provider is gemini or fallback
      let targetModel = modelConfig.modelId || 'gemini-3.8-flash';
      if (
        provider !== 'gemini' ||
        !['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'].includes(targetModel)
      ) {
        targetModel = targetModel === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';
      }

      const thinkingMap: Record<string, ThinkingLevel> = {
        MINIMAL: ThinkingLevel.MINIMAL,
        LOW: ThinkingLevel.LOW,
        MEDIUM: ThinkingLevel.MEDIUM,
        HIGH: ThinkingLevel.HIGH,
      };
      const chosenThinking = settings.thinkingLevel ? thinkingMap[settings.thinkingLevel] : undefined;

      const genConfig: any = {
        temperature: settings.temperature ?? 0.7,
      };
      if (systemInstruction) {
        genConfig.systemInstruction = systemInstruction;
      }
      if (chosenThinking && targetModel === 'gemini-3.8-flash' && chosenThinking !== ThinkingLevel.MINIMAL) {
        genConfig.thinkingConfig = { thinkingLevel: chosenThinking };
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: genConfig,
      });

      res.json({
        text: response.text || '',
        modelUsed: modelConfig.modelId,
        modality: 'text',
      });
    } catch (error: any) {
      console.error('Error in /api/model/call:', error);
      res.status(500).json({
        error: error?.message || 'Model invocation failed',
      });
    }
  });

  // 2. Non-Technical Action Code Assistant Endpoint
  // Helps users write or modify simple Action Node/JS flow code from plain English
  app.post('/api/action/assist', async (req, res) => {
    try {
      const { instruction, currentCode, parameters, modelConfigs, outputType } = req.body;
      const ai = getGenAIClient();

      const modelsSummary = (modelConfigs || [])
        .map((m: any, idx: number) => `models.list[${idx}] -> "${m.name}" (${m.modelId}, modality: ${m.modality})`)
        .join('\n');
      const paramsSummary = (parameters || [])
        .map((p: any) => `params.${p.name} (${p.label}, default: "${p.defaultValue}")`)
        .join('\n');

      const systemPrompt = `You are the Action Code Assistant inside Learning Space, an educational app for non-technical learners.
Write clean, simple, heavily-commented async JavaScript code for an Action.
Available globals in the Action runtime:
- \`params\`: Object with user parameter values:
${paramsSummary || '  (no parameters)'}
- \`models\`:
  - \`models.list\`: Ordered list of ModelConfigs assigned to this action:
${modelsSummary || '  models.list[0] (default model)'}
  - \`await models.call(0, prompt)\`: Calls model at index 0 (or pass a ModelConfig object/ID) and returns \`{ text, audioUrl }\`.
  - \`await models.callWithFallback(prompt)\`: Tries \`models.list[0]\`, then \`models.list[1]\`, etc. in order until one succeeds.
- \`assets\`:
  - \`assets.contextText\`: Combined text & comments of all checked workspace assets.
  - \`assets.selected\`: Array of checked asset objects.
- \`tools\`:
  - \`tools.log("Friendly message")\`: Updates the progress indicator.
  - \`await tools.createAsset({ title, type, content })\`: Creates a new asset and opens it. Allowed \`type\` values: 'md', 'ppx', 'ipynb', 'graph', 'sound'. NEVER create 'pdf' or 'video'.
  - \`await tools.sendChatMessage(text)\`: Posts a message to the Chat panel.

Format Rules for \`tools.createAsset\`:
- If type === 'md': \`content\` is Markdown with LaTeX equations ($...$ and $$...$$).
- If type === 'ppx': \`content\` is our Slidev/Marp-inspired Deck-Markdown format where slides are separated by \`---\` and use directives like \`@layout: infographic-grid\`, \`@stat: 95% | Accuracy | High\`, \`@step: 1 | Title | Detail\`, \`@callout: Note | Text\`.
- If type === 'ipynb': \`content\` is a JSON string of \`{ cells: [{ id, type: "markdown" | "code", language: "python" | "javascript", content }] }\`.
- If type === 'graph': \`content\` is a JSON string of \`{ nodes: [{ id, label, category, summary }], edges: [{ id, source, target, label }] }\`.
- If type === 'sound': Call a TTS model config (or \`models.call\`) and pass \`res.audioUrl\` as \`content\`.

Return ONLY valid JavaScript code (no markdown code fences around it). Keep it under 25 lines and include clear "// Step 1: ..." comments for non-technical readers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User Request: ${instruction}\nDesired Output Asset Type: ${outputType}\nCurrent Code:\n${currentCode || ''}`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
        },
      });

      const cleanedCode = (response.text || '')
        .replace(/^```(?:javascript|js|ts)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      res.json({ code: cleanedCode });
    } catch (error: any) {
      console.error('Error in /api/action/assist:', error);
      res.status(500).json({ error: error?.message || 'Failed to generate action code' });
    }
  });

  // 3. Grounded Multi-Asset Chat Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, contextAssets, availableActions } = req.body;
      const ai = getGenAIClient();

      const assetContextBlock = (contextAssets || [])
        .map(
          (a: any, i: number) =>
            `[Source ${i + 1}: "${a.title}" (${a.type.toUpperCase()})]\n${a.extractedText || a.content?.slice(0, 3000) || ''}\n${
              a.comments?.length
                ? 'Learner Comments:\n' +
                  a.comments
                    .map(
                      (c: any) =>
                        `- ${c.timestampSeconds != null ? `@${Math.floor(c.timestampSeconds / 60)}:${String(Math.floor(c.timestampSeconds % 60)).padStart(2, '0')} ` : ''}${c.text}`
                    )
                    .join('\n')
                : ''
            }`
        )
        .join('\n\n---\n\n');

      const actionsBlock = (availableActions || [])
        .map((act: any) => `- Action ID "${act.id}": ${act.name} (Creates: ${act.outputType}) — ${act.description}`)
        .join('\n');

      const systemInstruction = `You are the Learning Space AI Tutor, inspired by NotebookLM.
You help the user understand their study materials clearly, deeply, and accurately.
Always ground your answers in the selected workspace assets below and cite sources by name in brackets like [Source: Title].
Use LaTeX math ($...$ for inline equations and $$...$$ for block equations) whenever explaining mathematical, physical, or scientific formulas.
If the user asks to create a study guide, slide deck, infographic, notebook, concept graph, or audio overview, you can also recommend or trigger one of the workspace Actions:
${actionsBlock}

Selected Workspace Assets Context:
${assetContextBlock || '(No assets currently checked. Answer using general knowledge and remind the user they can check assets on the left.)'}`;

      const conversationTranscript = (history || [])
        .slice(-8)
        .map((m: any) => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.content}`)
        .join('\n\n');

      const fullPrompt = conversationTranscript
        ? `${conversationTranscript}\n\nLearner: ${message}`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });

      res.json({
        reply: response.text || 'I could not generate a response.',
      });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({ error: error?.message || 'Chat request failed' });
    }
  });

  // 4. WebSocket Server for Real-Time Gemini Live Voice Tutoring (`/live`)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    let liveSession: any = null;
    try {
      const ai = getGenAIClient();
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          systemInstruction:
            'You are the Live Voice Tutor inside Learning Space. Speak warmly, concisely, and clearly. Help the student reason through their study assets, equations, slides, and notebooks step by step.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            try {
              const parts = message.serverContent?.modelTurn?.parts || [];
              for (const part of parts) {
                const audioBase64 = part?.inlineData?.data;
                if (audioBase64 && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'audio', audio: audioBase64 }));
                }
                if (part?.text && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'transcript', text: part.text }));
                }
              }
              if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
            } catch (err) {
              console.error('Live message forward error:', err);
            }
          },
          onerror: (err: any) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Live session error' }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'connected' }));
      }

      clientWs.on('message', (raw) => {
        try {
          const payload = JSON.parse(raw.toString());
          if (payload.audio && liveSession) {
            liveSession.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (payload.contextText && liveSession) {
            liveSession.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [{ text: `Active workspace study context:\n${payload.contextText.slice(0, 4000)}` }],
                },
              ],
              turnComplete: false,
            });
          }
        } catch (err) {
          console.error('Error processing client live message:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          liveSession?.close?.();
        } catch {
          // ignore
        }
      });
    } catch (err: any) {
      console.error('Failed to initialize Gemini Live session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: err?.message || 'Could not connect to Gemini Live voice session.',
          })
        );
        clientWs.close();
      }
    }
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Learning Space server running on http://localhost:${PORT}`);
  });
}

startServer();

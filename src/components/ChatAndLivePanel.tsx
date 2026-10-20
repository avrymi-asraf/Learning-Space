import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  LearningAsset,
} from '../types';
import { renderMarkdownWithMath } from '../utils/mathRenderer';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  ExternalLink,
  Volume2,
  MessageSquare,
  Radio,
} from 'lucide-react';

interface ChatAndLivePanelProps {
  messages: ChatMessage[];
  assets: LearningAsset[];
  runningActionStatus: string | null;
  onSendMessage: (text: string) => Promise<void>;
  onOpenAsset: (assetId: string) => void;
}

function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const ChatAndLivePanel: React.FC<ChatAndLivePanelProps> = ({
  messages,
  assets,
  runningActionStatus,
  onSendMessage,
  onOpenAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'live'>('chat');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Live Voice State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Ready for real-time voice tutoring');
  const [liveTranscripts, setLiveTranscripts] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, runningActionStatus]);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input.trim();
    setInput('');
    setIsSending(true);
    try {
      await onSendMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const startLiveSession = async () => {
    try {
      setLiveStatus('Connecting to Gemini Live Voice Tutor...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      ws.onopen = async () => {
        setLiveStatus('Connected · Listening to your microphone...');
        setIsLiveActive(true);

        const contextText = assets
          .map((a) => `[${a.title}]: ${(a.extractedText || a.content).slice(0, 800)}`)
          .join('\n\n');
        ws.send(JSON.stringify({ contextText }));

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          const inputCtx = new AudioContext({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputCtx;
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const pcmBase64 = floatTo16BitPCMBase64(e.inputBuffer.getChannelData(0));
              ws.send(JSON.stringify({ audio: pcmBase64 }));
            }
          };
        } catch (micErr: any) {
          setLiveStatus(`Microphone permission needed: ${micErr.message}`);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio && outputAudioCtxRef.current) {
            const ctx = outputAudioCtxRef.current;
            const binary = atob(msg.audio);
            const len = binary.length / 2;
            const float32 = new Float32Array(len);
            const view = new DataView(new ArrayBuffer(binary.length));
            for (let i = 0; i < binary.length; i++) {
              view.setUint8(i, binary.charCodeAt(i));
            }
            for (let i = 0; i < len; i++) {
              float32[i] = view.getInt16(i * 2, true) / 32768;
            }
            const audioBuffer = ctx.createBuffer(1, len, 24000);
            audioBuffer.getChannelData(0).set(float32);
            const src = ctx.createBufferSource();
            src.buffer = audioBuffer;
            src.connect(ctx.destination);
            const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
            src.start(startTime);
            nextPlayTimeRef.current = startTime + audioBuffer.duration;
          } else if (msg.type === 'transcript' && msg.text) {
            setLiveTranscripts((prev) => [...prev.slice(-6), msg.text]);
          } else if (msg.type === 'interrupted' && outputAudioCtxRef.current) {
            nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
          } else if (msg.type === 'error') {
            setLiveStatus(`Live notice: ${msg.message}`);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsLiveActive(false);
        setLiveStatus('Live voice session ended');
      };
    } catch (err: any) {
      setLiveStatus(`Failed to start Live Voice: ${err.message}`);
      setIsLiveActive(false);
    }
  };

  const stopLiveSession = () => {
    try {
      wsRef.current?.close();
    } catch {}
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      inputAudioCtxRef.current?.close();
      outputAudioCtxRef.current?.close();
    } catch {}
    setIsLiveActive(false);
    setLiveStatus('Ready for real-time voice tutoring');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header: Chat vs Live Voice */}
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
        <span className="font-display text-xs font-semibold text-slate-800">
          Chat & Live Tutor
        </span>

        <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg">
          <button
            onClick={() => setActiveTab('chat')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'chat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3 h-3" />
            Live Voice
          </button>
        </div>
      </div>

      {/* TAB 1: GROUNDED CHAT */}
      {activeTab === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.role === 'action-log'
                      ? 'bg-emerald-50 border border-emerald-200 text-slate-800 w-full'
                      : 'bg-slate-100 text-slate-800 border border-slate-200/70'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div
                      className="space-y-1"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownWithMath(msg.content),
                      }}
                    />
                  )}

                  {msg.createdAssetId && (
                    <button
                      onClick={() => onOpenAsset(msg.createdAssetId!)}
                      className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Created Asset
                    </button>
                  )}
                </div>
              </div>
            ))}

            {runningActionStatus && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                <span>{runningActionStatus}</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Box */}
          <div className="p-3.5 border-t border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Ask about your study assets..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                disabled={isSending || !input.trim()}
                onClick={handleSend}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* TAB 2: REAL-TIME LIVE VOICE TUTOR */
        <div className="flex-1 flex flex-col items-center justify-between p-6 text-center bg-slate-50/50">
          <div className="space-y-1.5">
            <div className="font-mono text-xs font-semibold text-emerald-700">
              {isLiveActive ? '● LIVE VOICE ACTIVE' : 'LIVE VOICE TUTOR'}
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Talk About Your Assets Live
            </h3>
            <p className="text-xs text-slate-600 max-w-sm">
              Speak naturally to discuss equations, slides, notebooks, and concepts in real time.
            </p>
          </div>

          <div className="my-6 flex flex-col items-center gap-3">
            <button
              onClick={isLiveActive ? stopLiveSession : startLiveSession}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm ${
                isLiveActive
                  ? 'bg-emerald-600 text-white ring-8 ring-emerald-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isLiveActive ? (
                <>
                  <MicOff className="w-6 h-6" />
                  <span className="text-[11px] font-semibold">End Live</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  <span className="text-[11px] font-semibold">Start Live</span>
                </>
              )}
            </button>
            <div className="text-xs font-medium text-slate-700">{liveStatus}</div>
          </div>

          <div className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              Live Audio Stream
            </div>
            {liveTranscripts.length > 0 ? (
              <div className="space-y-1 text-xs text-slate-600 max-h-24 overflow-y-auto">
                {liveTranscripts.map((t, idx) => (
                  <p key={idx}>{t}</p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Click <strong>Start Live</strong> to begin a real-time spoken conversation.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

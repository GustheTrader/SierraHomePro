import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { Mic, MicOff, Volume2, X, Loader2, User, Bot } from 'lucide-react';
import { INITIAL_PROJECTS, AGENTS } from '../constants';

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface VoiceAssistantProps {
  onClose: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<{ type: 'user' | 'agent'; text: string }[]>([]);
  const [volume, setVolume] = useState(0);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const currentTranscriptionRef = useRef({ user: '', agent: '' });

  const systemInstruction = `You are the Sierra Home Pros Voice Dispatch Assistant based in Sparks, NV.
You help local handyman technicians and coordinators serving Reno-Sparks, Carson City, and Lake Tahoe with:
- Handyman repairs, smart-home installations, interior/exterior painting, recurring home maintenance plans, and senior home-safety upgrades.
- Active jobs today: ${INITIAL_PROJECTS.map(p => `${p.name} (${p.locationName})`).join(', ')}.
- Team specialists: ${AGENTS.map(a => a.name).join(', ')}.
Always emphasize clear written estimates before work begins, clean-home care, and concise field-ready guidance.`;

  const startSession = async () => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentTranscriptionRef.current.agent += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userT = currentTranscriptionRef.current.user;
              const agentT = currentTranscriptionRef.current.agent;
              if (userT || agentT) {
                setTranscript(prev => [
                  ...prev,
                  ...(userT ? [{ type: 'user' as const, text: userT }] : []),
                  ...(agentT ? [{ type: 'agent' as const, text: agentT }] : [])
                ]);
              }
              currentTranscriptionRef.current = { user: '', agent: '' };
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const outCtx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to start voice dispatch:', error);
      setIsConnecting(false);
    }
  };

  const stopSession = useCallback(() => {
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-800 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-zinc-100">Sierra Voice Dispatch</p>
          <p className="text-[11px] text-zinc-400">Hands-free van & job updates</p>
        </div>
        <button
          onClick={() => {
            stopSession();
            onClose();
          }}
          className="text-zinc-400 hover:text-zinc-100 p-1"
          aria-label="Close voice dispatch"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            Tap the microphone below to talk with Sierra Dispatch about job notes, estimates, or schedules.
          </p>
        ) : (
          transcript.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1">
                {msg.type === 'user' ? <User size={10} /> : <Bot size={10} className="text-emerald-400" />}
                <span>{msg.type === 'user' ? 'You' : 'Sierra Dispatch'}</span>
              </div>
              <div className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                msg.type === 'user'
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-zinc-100'
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between gap-3">
        {isActive ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, volume * 90 * (1 + i * 0.2))}px` }}
                />
              ))}
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg ${isMuted ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
              {isMuted ? <MicOff size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        ) : (
          <span className="text-xs text-zinc-500">
            {isConnecting ? 'Connecting...' : 'Ready for voice call'}
          </span>
        )}

        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            isActive
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
          }`}
        >
          {isConnecting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isActive ? (
            <>End Call</>
          ) : (
            <>
              <Mic size={14} /> Start Voice
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;


import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { PodcastMetadata } from '../types';
import { synthesizePodcastAudio, decodeAudioData } from '../services/geminiService';

interface Props {
  metadata: PodcastMetadata;
  onClose: () => void;
}

export const PodcastView: React.FC<Props> = ({ metadata, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateProgress = () => {
    if (isPlaying) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setCurrentTime(elapsed);
      
      const totalWords = metadata.totalWordCount;
      let wordCursor = 0;
      for (let i = 0; i < metadata.segments.length; i++) {
        const seg = metadata.segments[i];
        const segWordCount = seg.script?.split(/\s+/).length || 0;
        const segEndTime = ((wordCursor + segWordCount) / totalWords) * duration;
        if (elapsed < segEndTime) {
          setActiveSegmentIndex(i);
          break;
        }
        wordCursor += segWordCount;
      }

      if (elapsed >= duration) {
        setIsPlaying(false);
        pausedAtRef.current = 0;
        setCurrentTime(0);
        return;
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, duration]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const audioData = await synthesizePodcastAudio(metadata.fullScript);
      if (audioData) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const buffer = await decodeAudioData(audioData, ctx, 24000, 1);
        (window as any).__podcastBuffer = buffer;
        setDuration(buffer.duration);
        setHasAudio(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    const buffer = (window as any).__podcastBuffer;
    if (!buffer) return;

    if (isPlaying) {
      pausedAtRef.current = Date.now() - startTimeRef.current;
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
    } else {
      const ctx = audioContextRef.current!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      const offset = (pausedAtRef.current / 1000) % buffer.duration;
      source.start(0, offset);
      startTimeRef.current = Date.now() - pausedAtRef.current;
      
      source.onended = () => {
        if (isPlaying && (Date.now() - startTimeRef.current) / 1000 >= buffer.duration - 0.5) {
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setCurrentTime(0);
        }
      };
      
      sourceNodeRef.current = source;
      setIsPlaying(true);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const buffer = (window as any).__podcastBuffer;
    if (!buffer) return;

    if (isPlaying) {
      sourceNodeRef.current?.stop();
    }
    
    pausedAtRef.current = time * 1000;
    setCurrentTime(time);
    
    if (isPlaying) {
      const ctx = audioContextRef.current!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0, time);
      startTimeRef.current = Date.now() - pausedAtRef.current;
      sourceNodeRef.current = source;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black backdrop-blur-3xl flex flex-col items-center overflow-y-auto animate-in fade-in duration-700">
      <div className="w-full max-w-3xl flex flex-col min-h-screen">
        {/* Persistent Top Header - Fully Flush */}
        <div className="w-full flex justify-between items-center px-4 md:px-12 py-6 md:py-8 sticky top-0 bg-black/60 backdrop-blur-xl z-[160] border-b border-slate-900/50">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)] animate-pulse"></div>
             <div className="flex flex-col">
                <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white">Audio Synthesis</span>
                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">Neural Stream</span>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white transition-all">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="px-4 md:px-12 pb-20 md:pb-24 flex-1 flex flex-col pt-6 md:pt-12">
          <div className="space-y-4 md:space-y-6 text-center mb-10 md:mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl">Podcast Overview</div>
            <h2 className="text-2xl md:text-6xl font-serif text-white tracking-tight leading-tight px-2">{metadata.topic}</h2>
            <div className="w-12 md:w-16 h-0.5 md:h-1 bg-blue-600/20 mx-auto rounded-full"></div>
            <p className="text-slate-500 text-sm md:text-xl font-light italic max-w-lg mx-auto italic">"Synthesized dialogue with Alex & Jordan"</p>
          </div>

          {/* Premium Visualizer */}
          <div className="flex items-end justify-center gap-1 h-16 md:h-24 mb-10 md:mb-16 w-full px-2 md:px-4">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 bg-gradient-to-t from-blue-800 via-blue-500 to-blue-300 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-1.5'}`}
                style={{ 
                  height: isPlaying ? `${15 + Math.random() * 85}%` : '6px',
                  animationDelay: `${i * 0.04}s`
                }} 
              />
            ))}
          </div>

          <div className="w-full bg-[#080808] border border-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-14 space-y-8 md:space-y-10 shadow-3xl relative group">
            <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-blue-600/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none opacity-50"></div>
            
            <div className="grid grid-cols-2 gap-4 md:gap-10 border-b border-slate-800/50 pb-6 md:pb-10">
              <div className="space-y-1">
                <p className="text-[9px] md:text-[11px] font-black text-slate-600 uppercase tracking-widest">Scope</p>
                <p className="text-white font-serif text-lg md:text-3xl">~{metadata.durationMinutes} <span className="text-[9px] font-sans text-slate-500 uppercase font-black">MIN</span></p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] md:text-[11px] font-black text-slate-600 uppercase tracking-widest">Scale</p>
                <p className="text-white font-serif text-lg md:text-3xl">{metadata.totalWordCount.toLocaleString()} <span className="text-[9px] font-sans text-slate-500 uppercase font-black">WDS</span></p>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8 text-left max-h-[35vh] md:max-h-[45vh] overflow-y-auto pr-4 md:pr-6 scrollbar-hide">
              {metadata.segments.map((seg, idx) => (
                <div 
                  key={idx} 
                  className={`group border-l-2 pl-4 md:pl-8 py-2 md:py-3 transition-all duration-700 ${idx === activeSegmentIndex && isPlaying ? 'border-blue-500 bg-blue-600/5 translate-x-1' : 'border-slate-900'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-[10px] md:text-lg font-black uppercase tracking-tight transition-colors ${idx === activeSegmentIndex && isPlaying ? 'text-blue-400' : 'text-slate-200'}`}>
                      {seg.segment}
                    </h4>
                    <span className="text-blue-600/40 font-mono text-[9px] md:text-[11px] font-bold tabular-nums">{seg.duration}</span>
                  </div>
                  <div className="text-slate-500 font-light text-[11px] md:text-base leading-relaxed group-hover:text-slate-300">
                    <ReactMarkdown>{seg.goal}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>

            {hasAudio && (
              <div className="space-y-4 pt-6 md:pt-10 border-t border-slate-800/50">
                <div className="flex items-center justify-between text-[10px] md:text-[12px] font-mono text-slate-400 px-1 font-black tracking-widest">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative h-1.5 w-full group/scrub">
                   <div className="absolute inset-0 bg-slate-900/50 rounded-full" />
                   <div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full shadow-lg" style={{ width: `${(currentTime/duration)*100}%` }} />
                   <input 
                    type="range" 
                    min="0" 
                    max={duration} 
                    step="0.01"
                    value={currentTime} 
                    onChange={handleScrub}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-6 md:gap-8 w-full mt-auto py-10 md:py-16">
            {!hasAudio ? (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full max-w-xs md:max-w-md px-8 py-4 md:px-12 md:py-6 bg-white text-black rounded-xl md:rounded-[2rem] font-black text-[10px] md:text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 md:h-6 md:w-6 text-black" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      SYNCHRONIZING...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                      GENERATE EPISODE
                    </>
                  )}
                </span>
              </button>
            ) : (
              <button 
                onClick={togglePlayback}
                className="w-20 h-20 md:w-28 md:h-28 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-500 hover:scale-110 transition-all active:scale-90 group relative"
              >
                {isPlaying ? (
                   <svg className="w-10 h-10 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path></svg>
                ) : (
                   <svg className="w-10 h-10 md:w-12 md:h-12 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                )}
                <div className="absolute inset-0 rounded-full border border-white/10 scale-100 group-hover:scale-125 transition-transform duration-700" />
              </button>
            )}
            
            <div className="flex flex-col items-center gap-2">
               <p className="text-[9px] md:text-[11px] font-black text-slate-600 uppercase tracking-widest">Hifi Synthesis Engine v8.2</p>
               {isGenerating && <p className="text-[7px] md:text-[9px] font-bold text-blue-500 uppercase tracking-widest animate-pulse">Assigning neural weights...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

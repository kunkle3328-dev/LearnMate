
import React, { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [bootStep, setBootStep] = useState(0);
  const [telemetry, setTelemetry] = useState<string[]>([]);

  const telemetryLines = [
    "INITIALIZING GROUNDED ENGINE...",
    "ESTABLISHING SECURE API TUNNEL...",
    "FETCHING SEMANTIC NEURAL WEIGHTS...",
    "LOADING EXPERT DOMAIN ADAPTERS...",
    "CALIBRATING SYNTHETIC VOICES...",
    "READY."
  ];

  useEffect(() => {
    // Progression of animations
    const timers = [
      setTimeout(() => setBootStep(1), 500),   // Icon Draw
      setTimeout(() => setBootStep(2), 1500),  // Text Reveal
      setTimeout(() => setBootStep(3), 2200),  // Telemetry Start
      setTimeout(() => onComplete(), 4800),    // Finish
    ];

    // Rapid telemetry scroll
    let currentLine = 0;
    const telemetryInterval = setInterval(() => {
      if (currentLine < telemetryLines.length) {
        setTelemetry(prev => [...prev, telemetryLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(telemetryInterval);
      }
    }, 450);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(telemetryInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08)_0%,transparent_70%)] animate-pulse" />
      
      {/* Central Content Container */}
      <div className="flex flex-col items-center justify-center -mt-20 md:-mt-32">
        {/* The Premium Logo Assembly */}
        <div className="relative mb-8 md:mb-12">
          <div className={`transition-all duration-1000 ease-out ${bootStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <svg width="140" height="140" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Outer Neural Ring - Rotating */}
              <circle 
                cx="50" cy="50" r="45" 
                stroke="#2563eb" strokeWidth="0.5" strokeOpacity="0.2" 
                strokeDasharray="2 6"
                className="animate-[spin_10s_linear_infinite]"
              />
              
              {/* Hexagon Frame */}
              <path 
                d="M50 8 L87 29.5 V70.5 L50 92 L13 70.5 V29.5 L50 8Z" 
                stroke="url(#logo-grad)" 
                strokeWidth="1.5" 
                strokeOpacity="0.8"
                className="animate-[dash_3s_ease-in-out_infinite]"
                style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'dash 2s forwards' }}
              />

              {/* The "Neural L" Mark */}
              <g className={bootStep >= 1 ? 'animate-in fade-in zoom-in duration-1000' : 'opacity-0'}>
                {/* Thick Glass Layer */}
                <path 
                  d="M38 32 V68 H62" 
                  stroke="white" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeOpacity="0.1" 
                />
                {/* Main Stroke */}
                <path 
                  d="M38 32 V68 H62" 
                  stroke="url(#logo-grad)" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  filter="url(#glow)"
                />
                {/* Terminal Nodes */}
                <circle cx="38" cy="32" r="2.5" fill="white" />
                <circle cx="62" cy="68" r="2.5" fill="white" />
                <circle cx="38" cy="68" r="1.5" fill="#3b82f6" />
              </g>

              {/* Data Synapses */}
              <line x1="13" y1="29.5" x2="38" y2="32" stroke="#2563eb" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="1 2" />
              <line x1="87" y1="70.5" x2="62" y2="68" stroke="#2563eb" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="1 2" />
            </svg>
          </div>
        </div>

        {/* Brand Name */}
        <div className={`text-center space-y-3 transition-all duration-1000 delay-300 ${bootStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl md:text-5xl font-serif text-white tracking-[0.2em] relative group">
            LEARN<span className="italic text-blue-500">MATE</span>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />
          </h1>
          <p className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-[0.5em] text-center">Neural Companion Interface</p>
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="absolute bottom-16 left-0 right-0 px-8 flex flex-col items-center">
        <div className="w-48 h-px bg-slate-900 mb-6 overflow-hidden">
          <div className={`h-full bg-blue-600 transition-all duration-[3000ms] ${bootStep >= 1 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className="h-20 flex flex-col items-center justify-start overflow-hidden">
           {telemetry.map((line, i) => (
             <p key={i} className="text-[8px] md:text-[10px] font-mono text-blue-500/60 uppercase tracking-tighter animate-in slide-in-from-bottom-1 duration-300">
               {line}
             </p>
           ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </div>
  );
};

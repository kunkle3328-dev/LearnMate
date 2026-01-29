
import React from 'react';
import { LearningSession } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onNewSession: () => void;
  history: LearningSession[];
  onSelectSession: (session: LearningSession) => void;
  activeTab: 'new' | 'library' | 'stats' | 'active';
  setActiveTab: (tab: 'new' | 'library' | 'stats' | 'active') => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onNewSession, 
  history, 
  onSelectSession,
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-slate-200">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-80 bg-black border-r border-slate-900/50 p-8 flex-col h-screen sticky top-0">
        <div className="flex items-center gap-4 mb-16 group cursor-pointer" onClick={() => { onNewSession(); setActiveTab('new'); }}>
          <div className="relative w-14 h-14 bg-[#080808] border border-slate-800 rounded-2xl flex items-center justify-center shadow-2xl group-hover:border-blue-500/50 transition-all overflow-hidden">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="side-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <path 
                d="M50 10 L85 30 V70 L50 90 L15 30 V30 L50 10Z" 
                stroke="#2563eb" strokeWidth="2" strokeOpacity="0.2" 
              />
              <path 
                d="M38 32 V68 H62" 
                stroke="url(#side-grad)" 
                strokeWidth="8" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <circle cx="38" cy="32" r="4" fill="white" />
              <circle cx="62" cy="68" r="4" fill="white" />
            </svg>
            <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">LearnMate</h1>
            <p className="text-[11px] text-slate-500 mt-2 uppercase tracking-[0.3em] font-black italic">Expert Companion</p>
          </div>
        </div>
        
        <button 
          onClick={() => { onNewSession(); setActiveTab('new'); }}
          className="w-full text-left px-6 py-5 rounded-[2rem] bg-gradient-to-br from-white to-slate-200 text-black hover:to-white transition-all flex items-center justify-between group font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,255,255,0.1)] mb-12 overflow-hidden relative active:scale-[0.98]"
        >
          <span className="relative z-10">Initiate Mission</span> 
          <svg className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>

        <div className="flex-1 overflow-y-auto space-y-10 pr-2 scrollbar-hide">
          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-700 px-4">Temporal Records</h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="px-6 py-12 rounded-3xl border border-dashed border-slate-900/50 text-center bg-[#050505]">
                  <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest italic">History Unwritten</p>
                </div>
              ) : history.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onSelectSession(s); setActiveTab('active'); }}
                  className={`w-full text-left px-5 py-5 rounded-3xl border transition-all group relative overflow-hidden active:scale-[0.98] ${activeTab === 'active' && s.id === (window as any).__activeId ? 'bg-[#0a0a0a] border-blue-600/30 shadow-2xl' : 'bg-transparent border-transparent hover:bg-slate-900/40 hover:border-slate-800'}`}
                >
                  <p className="text-sm font-black text-slate-200 group-hover:text-blue-400 truncate transition-colors leading-tight">{s.topic}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{s.level}</span>
                    <span className="text-[10px] text-slate-800 font-bold tabular-nums">{new Date(s.timestamp).toLocaleDateString()}</span>
                  </div>
                  {activeTab === 'active' && s.id === (window as any).__activeId && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-900/50 mt-8">
           <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-900/10 border border-slate-900/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">System Synchronized</span>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505] pb-16 md:pb-0">
        <header className="h-20 bg-black/70 backdrop-blur-2xl border-b border-slate-900/50 px-8 md:px-12 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="md:hidden w-10 h-10 bg-[#080808] border border-slate-800 rounded-xl flex items-center justify-center shadow-xl">
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M38 32 V68 H62" stroke="#2563eb" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/30 border border-slate-800/50 shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Terminal V3.2</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex flex-col items-end">
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural Link Secure</span>
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">Identity Verified</span>
            </div>
            <button className="w-11 h-11 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center justify-center text-[10px] font-black text-blue-500 shadow-2xl group cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all active:scale-95">
               USR
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-14 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Elite Icons */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/95 backdrop-blur-3xl border-t border-slate-900/50 flex items-center justify-around px-6 z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.9)] pb-4">
        <button 
          onClick={() => { onNewSession(); setActiveTab('new'); }}
          className={`flex flex-col items-center gap-1.5 transition-all relative py-2 ${activeTab === 'new' ? 'text-blue-500' : 'text-slate-600'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">NEW</span>
          {activeTab === 'new' && <div className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1.5 transition-all relative py-2 ${activeTab === 'library' ? 'text-blue-500' : 'text-slate-600'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">VAULT</span>
          {activeTab === 'library' && <div className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          disabled={activeTab === 'new' || activeTab === 'library' || activeTab === 'stats'}
          className={`flex flex-col items-center gap-1.5 transition-all relative py-2 ${activeTab === 'active' ? 'text-blue-500' : 'text-slate-600 opacity-20'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">LESSON</span>
          {activeTab === 'active' && <div className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1.5 transition-all relative py-2 ${activeTab === 'stats' ? 'text-blue-500' : 'text-slate-600'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">STATS</span>
          {activeTab === 'stats' && <div className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)]" />}
        </button>
      </nav>
    </div>
  );
};

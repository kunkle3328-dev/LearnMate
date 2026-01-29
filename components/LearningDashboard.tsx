
import React, { useState } from 'react';
import { LearningLevel, LearningMode, MentorPersonality, LearningSession } from '../types';
import { fetchExpertKnowledge, expandQuery } from '../services/geminiService';
import { knowledgeEngine, getUserId } from '../services/knowledgeEngine';

interface Props {
  onSessionCreated: (session: LearningSession) => void;
}

export const LearningDashboard: React.FC<Props> = ({ onSessionCreated }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<LearningLevel>(LearningLevel.BEGINNER);
  const [mode, setMode] = useState<LearningMode>(LearningMode.OVERVIEW);
  const [personality, setPersonality] = useState<MentorPersonality>(MentorPersonality.FRIENDLY);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && mode !== LearningMode.VAULT_TEACH) return;

    setLoading(true);
    const steps = ["Analyzing intent...", "Querying Vault...", "Retrieving docs...", "Synthesizing..."];
    let stepIdx = 0;
    const interval = setInterval(() => {
      setStatusText(steps[stepIdx % steps.length]);
      stepIdx++;
    }, 1200);

    try {
      const vaults = await knowledgeEngine.fetchVaults(getUserId());
      const activeVaultId = vaults[0].id; 
      
      let vaultItems: string[] = [];
      if (mode === LearningMode.VAULT_TEACH || mode === LearningMode.INTERACTIVE) {
        const items = await knowledgeEngine.fetchKnowledge(getUserId(), activeVaultId);
        vaultItems = items.map(item => `[${item.topic || 'Source'}]: ${item.content}`);
      }

      const expandedTopics = await expandQuery(topic || "Integrated Synthesis");
      const { text, sections, sources } = await fetchExpertKnowledge(topic || "Synthesis", level, mode, personality, expandedTopics, vaultItems);
      
      onSessionCreated({
        id: crypto.randomUUID(), topic: topic || "Vault Synthesis", level, mode, personality, summary: text, sections, sources, timestamp: Date.now(), quizzes: [], chatHistory: [], notes: '', highlights: [], masteryScore: 0, confusionPoints: []
      });
    } catch (err) {
      alert("Link Interrupted. Try a more specific query.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="py-4 md:py-16 animate-in fade-in duration-1000">
      <div className="mb-6 md:mb-16 text-center space-y-3 px-2">
        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(37,99,235,0.1)]">LearnMate Engine v3.2</div>
        <h2 className="text-3xl sm:text-5xl md:text-8xl font-serif text-white tracking-tight leading-tight">Build <span className="italic text-blue-600">Knowledge.</span></h2>
        <p className="text-slate-500 max-w-xl mx-auto text-[11px] sm:text-base md:text-2xl font-light">The ultimate grounded learning engine. Personal memory met with expert evidence.</p>
      </div>

      <form onSubmit={handleStart} className="space-y-6 md:space-y-16 bg-[#080808]/80 backdrop-blur-xl p-6 sm:p-12 md:p-24 rounded-[2rem] md:rounded-[4rem] border border-slate-900/50 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-blue-600/5 rounded-full blur-[80px] md:blur-[140px]"></div>
        
        <div className="space-y-3 md:space-y-4 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Objective</label>
          <div className="relative group">
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="Topic or question..." 
              className="w-full px-6 py-5 sm:px-12 sm:py-8 rounded-2xl md:rounded-[2.5rem] bg-black border border-slate-800 text-white placeholder-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-lg md:text-5xl transition-all font-light shadow-inner group-hover:border-slate-700" 
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-blue-600 transition-colors">
              <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 relative z-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Cognitive Depth</label>
            <div className="flex flex-col gap-2">
              {Object.values(LearningLevel).map((l) => (
                <button 
                  key={l} 
                  type="button" 
                  onClick={() => setLevel(l)} 
                  className={`py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg active:scale-95 ${level === l ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 text-white shadow-[0_5px_20px_rgba(37,99,235,0.3)]' : 'bg-black border-slate-900 text-slate-700 hover:text-slate-300 hover:border-slate-800'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Synapse Mode</label>
            <div className="flex flex-col gap-2">
              {Object.values(LearningMode).map((m) => (
                <button 
                  key={m} 
                  type="button" 
                  onClick={() => setMode(m)} 
                  className={`py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg active:scale-95 ${mode === m ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 text-white shadow-[0_5px_20px_rgba(37,99,235,0.3)]' : 'bg-black border-slate-900 text-slate-700 hover:text-slate-300 hover:border-slate-800'}`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Mentor Interface</label>
            <div className="flex flex-col gap-2">
              {Object.values(MentorPersonality).map((p) => (
                <button 
                  key={p} 
                  type="button" 
                  onClick={() => setPersonality(p)} 
                  className={`py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg active:scale-95 ${personality === p ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 text-white shadow-[0_5px_20px_rgba(37,99,235,0.3)]' : 'bg-black border-slate-900 text-slate-700 hover:text-slate-300 hover:border-slate-800'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          disabled={loading} 
          type="submit" 
          className="w-full bg-gradient-to-br from-white to-slate-200 text-black py-5 md:py-8 rounded-2xl md:rounded-[2.5rem] font-black text-sm md:text-2xl uppercase tracking-[0.3em] hover:to-white transition-all shadow-2xl relative overflow-hidden active:scale-[0.99]"
        >
          <span className="relative z-10">{loading ? <span className="animate-pulse">{statusText}</span> : "Initiate Neural Sync"}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
        </button>
      </form>
    </div>
  );
};

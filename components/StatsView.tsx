
import React, { useState, useEffect } from 'react';
import { LearningSession, KnowledgeItem, EvolutionTier } from '../types';
import { adaptiveLearning } from '../services/adaptiveLearning';
import { getUserId } from '../services/knowledgeEngine';

interface Props {
  history: LearningSession[];
  vault: KnowledgeItem[];
}

export const StatsView: React.FC<Props> = ({ history, vault }) => {
  const [profile, setProfile] = useState(adaptiveLearning.getProfile(getUserId()));
  const [signals, setSignals] = useState(adaptiveLearning.getEvolutionSignals(profile));
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setSignals(adaptiveLearning.getEvolutionSignals(profile));
  }, [profile]);

  const totalSessions = history.length;
  const totalVaultItems = vault.length;
  
  const avgMastery = history.length > 0 
    ? (history.reduce((acc, s) => acc + (s.masteryScore || 0), 0) / history.length) * 100 
    : 0;

  const handleUpgrade = () => {
    if (!signals.nextTierReady) return;
    const updated = adaptiveLearning.upgradeTier(getUserId());
    setProfile(updated);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getUnlockedItems = (tier: EvolutionTier) => {
    switch(tier) {
      case EvolutionTier.EXPLORER:
        return ["Intuitive Summaries", "Foundational Takeaways"];
      case EvolutionTier.STRUCTURED_LEARNER:
        return ["Technical Tradeoffs", "Structural Mechanism Analysis", "Deep Archival Metadata"];
      case EvolutionTier.SOCRATIC_THINKER:
        return ["Socratic Reasoning Mode", "Assumptions Probing", "Delayed Answer Protocols"];
      case EvolutionTier.SYSTEMS_MASTER:
        return ["Cross-Domain Synthesis", "Emergent Property Analysis", "Multi-Domain Implications"];
      default:
        return [];
    }
  };

  const getNextTierName = (tier: EvolutionTier) => {
    const tiers = Object.values(EvolutionTier);
    const idx = tiers.indexOf(tier);
    return idx < tiers.length - 1 ? tiers[idx + 1] : "Ultimate Mastery";
  };

  return (
    <div className="py-6 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 md:space-y-12 pb-24 relative">
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
          Evolution Successful: {profile.evolutionTier}
        </div>
      )}

      <div className="space-y-2 px-2">
        <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight">Cognitive Analytics</h2>
        <div className="flex items-center gap-2">
           <p className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-[0.3em]">Neural Tier: <span className="text-blue-500">{profile.evolutionTier}</span></p>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        <div className="bg-[#080808] border border-slate-900 p-6 rounded-3xl space-y-2 group hover:border-blue-500/30 transition-all">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Knowledge Density</p>
          <p className="text-3xl md:text-4xl font-serif text-white">{totalVaultItems}</p>
          <p className="text-[8px] text-slate-600 font-bold uppercase">Stored Nodes</p>
        </div>
        <div className="bg-[#080808] border border-slate-900 p-6 rounded-3xl space-y-2 group hover:border-blue-500/30 transition-all">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Neural Syncs</p>
          <p className="text-3xl md:text-4xl font-serif text-white">{totalSessions}</p>
          <p className="text-[8px] text-slate-600 font-bold uppercase">Sessions</p>
        </div>
        <div className="bg-[#080808] border border-slate-900 p-6 rounded-3xl space-y-2 group hover:border-blue-500/30 transition-all">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Mastery Avg</p>
          <p className="text-3xl md:text-4xl font-serif text-white">{avgMastery.toFixed(0)}%</p>
          <p className="text-[8px] text-slate-600 font-bold uppercase">Retention Rate</p>
        </div>
        <div className="bg-[#080808] border border-slate-900 p-6 rounded-3xl space-y-2 group hover:border-blue-500/30 transition-all">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Inquiry Depth</p>
          <p className="text-3xl md:text-4xl font-serif text-white">{signals.avgDepth.toFixed(1)}</p>
          <p className="text-[8px] text-slate-600 font-bold uppercase">Turns / Topic</p>
        </div>
      </div>

      {/* Evolution Management Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
        {/* Tier Benefits & Signals */}
        <div className="bg-[#080808] border border-slate-900 p-8 rounded-[2.5rem] space-y-10">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Cognitive Signal Diagnostics</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Retention Velocity</span>
                   <span className="text-xs font-mono text-blue-500">{(signals.masteryVelocity * 100).toFixed(0)}%</span>
                 </div>
                 <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${signals.masteryVelocity * 100}%` }}></div>
                 </div>
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Archival Persistence</span>
                   <span className="text-xs font-mono text-blue-500">{(signals.vaultUsageRate * 100).toFixed(0)}%</span>
                 </div>
                 <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${signals.vaultUsageRate * 100}%` }}></div>
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Proactive Discovery</span>
                   <span className="text-xs font-mono text-blue-500">{Math.min(signals.avgDepth * 25, 100).toFixed(0)}%</span>
                 </div>
                 <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(signals.avgDepth * 25, 100)}%` }}></div>
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900">
             <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Unlocked Cognitive Protocols</h4>
             <div className="grid grid-cols-1 gap-2">
                {getUnlockedItems(profile.evolutionTier).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-blue-600/5 border border-blue-500/10 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                    <span className="text-[10px] text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Evolution Readiness (The Core Lock) */}
        <div className={`bg-[#080808] border p-8 rounded-[2.5rem] flex flex-col justify-between space-y-6 transition-all duration-700 ${signals.nextTierReady ? 'border-blue-500/50 shadow-[0_0_60px_rgba(59,130,246,0.15)] scale-[1.02]' : 'border-slate-900'}`}>
           <div className="space-y-4">
             <div className="flex justify-between items-start">
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-700 ${signals.nextTierReady ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] bg-blue-500/10' : 'border-slate-800 text-slate-700 opacity-50'}`}>
                  {signals.nextTierReady ? '🚀' : '🔒'}
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Evolution Sync</p>
                   <p className="text-lg font-serif text-white">{signals.progressPercent.toFixed(0)}%</p>
                </div>
             </div>
             
             <h4 className="text-2xl md:text-3xl font-serif text-white tracking-tight">
               {signals.nextTierReady ? "Evolution Ready" : "Protocol Locked"}
             </h4>
             
             <div className="space-y-5">
                <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-black tracking-widest border-b border-slate-900 pb-2">Verification Thresholds:</p>
                
                <div className="space-y-4">
                  {/* Inquiry Depth Signal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${signals.inquiryCount >= signals.inquiryThreshold ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-900'}`}></div>
                        <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${signals.inquiryCount >= signals.inquiryThreshold ? 'text-emerald-500' : 'text-slate-600'}`}>
                          Deep Inquiry Pattern
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                        {signals.inquiryCount} / {signals.inquiryThreshold}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-900/50 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-500 ${signals.inquiryCount >= signals.inquiryThreshold ? 'bg-emerald-500' : 'bg-slate-700'}`} style={{ width: `${Math.min((signals.inquiryCount/signals.inquiryThreshold)*100, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* Knowledge Persistence Signal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${signals.vaultSaveCount >= signals.vaultThreshold ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-900'}`}></div>
                        <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${signals.vaultSaveCount >= signals.vaultThreshold ? 'text-emerald-500' : 'text-slate-600'}`}>
                          Knowledge Persistence
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                        {signals.vaultSaveCount} / {signals.vaultThreshold}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-900/50 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-500 ${signals.vaultSaveCount >= signals.vaultThreshold ? 'bg-emerald-500' : 'bg-slate-700'}`} style={{ width: `${Math.min((signals.vaultSaveCount/signals.vaultThreshold)*100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  {signals.currentTopic && (
                    <div className="px-3 py-2 bg-blue-600/5 border border-blue-500/10 rounded-lg">
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest leading-none">
                        Monitoring Domain: <span className="text-blue-500">{signals.currentTopic}</span>
                      </p>
                    </div>
                  )}
                </div>
             </div>
           </div>
           
           <div className="space-y-4">
             <div className="p-4 bg-[#0a0a0a] border border-slate-900 rounded-xl">
               <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                 {signals.nextTierReady 
                  ? `Evolution verified. Your cognitive behavior now supports ${getNextTierName(profile.evolutionTier)} reasoning. Sound and visual cues will initiate upon sync.` 
                  : `To unlock this evolution: Ask ${Math.max(0, signals.inquiryThreshold - signals.inquiryCount)} more follow-up questions (why/how/compare) and archive ${Math.max(0, signals.vaultThreshold - signals.vaultSaveCount)} more insights to your Vault for "${signals.currentTopic || 'your active topic'}".`}
               </p>
             </div>
             <button 
              onClick={handleUpgrade}
              disabled={!signals.nextTierReady}
              className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-3xl group overflow-hidden relative ${
                signals.nextTierReady 
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_10px_30px_rgba(37,99,235,0.4)]' 
                : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800'
              }`}
             >
               <span className="relative z-10">{signals.nextTierReady ? 'UPGRADE COGNITIVE SYNC' : 'PROTOCOL LOCKED'}</span>
               {signals.nextTierReady && (
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
               )}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

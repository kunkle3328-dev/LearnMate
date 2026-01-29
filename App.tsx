
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { LearningDashboard } from './components/LearningDashboard';
import { SessionView } from './components/SessionView';
import { SplashScreen } from './components/SplashScreen';
import { KnowledgeDetailView } from './components/KnowledgeDetailView';
import { StatsView } from './components/StatsView';
import { LearningSession, KnowledgeItem, LearningMode, LearningLevel, MentorPersonality, Vault } from './types';
import { knowledgeEngine, getUserId } from './services/knowledgeEngine';
import { fetchExpertKnowledge } from './services/geminiService';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<LearningSession[]>([]);
  const [knowledgeVault, setKnowledgeVault] = useState<KnowledgeItem[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [activeVaultId, setActiveVaultId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'new' | 'library' | 'stats' | 'active'>('new');
  const [selectedKnowledgeItem, setSelectedKnowledgeItem] = useState<KnowledgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [isTeaching, setIsTeaching] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Vault Creation UI State
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('learnmate_sessions_v1');
    if (saved) {
      try { setSessionHistory(JSON.parse(saved)); } catch (e) { console.error("History load error"); }
    }
  }, []);

  const initializeVaults = async () => {
    const fetchedVaults = await knowledgeEngine.fetchVaults(getUserId());
    setVaults(fetchedVaults);
    if (fetchedVaults.length > 0 && !activeVaultId) {
      setActiveVaultId(fetchedVaults[0].id);
    }
  };

  useEffect(() => {
    if (!isBooting) initializeVaults();
  }, [isBooting]);

  const syncVaultData = async () => {
    if (!activeVaultId) return;
    setIsLoadingVault(true);
    try {
      const items = await knowledgeEngine.fetchKnowledge(getUserId(), activeVaultId);
      setKnowledgeVault(items);
    } catch (err) {
      console.error("Vault sync error", err);
    } finally {
      setIsLoadingVault(false);
    }
  };

  useEffect(() => {
    if (activeVaultId && !isBooting) syncVaultData();
  }, [activeVaultId, activeTab, isBooting]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateVaultConfirm = async () => {
    if (newVaultName.trim()) {
      const v = await knowledgeEngine.saveVault({ userId: getUserId(), name: newVaultName.trim() });
      setVaults(prev => [...prev, v]);
      setActiveVaultId(v.id);
      setNewVaultName('');
      setIsCreatingVault(false);
      showToast(`Vault established ✓`, 'success');
    }
  };

  const startNew = () => {
    setActiveSession(null);
    setActiveTab('new');
    setSelectedKnowledgeItem(null);
  };

  const handleSelectSession = (session: LearningSession) => {
    setActiveSession(session);
    setActiveTab('active');
    setSelectedKnowledgeItem(null);
  };

  const handleSessionCreated = (session: LearningSession) => {
    setActiveSession(session);
    setActiveTab('active');
    const newHistory = [session, ...sessionHistory.filter(h => h.id !== session.id)].slice(0, 50);
    setSessionHistory(newHistory);
    localStorage.setItem('learnmate_sessions_v1', JSON.stringify(newHistory));
  };

  const handleUpdateSession = (updated: LearningSession) => {
    setActiveSession(updated);
    const newHistory = sessionHistory.map(s => s.id === updated.id ? updated : s);
    setSessionHistory(newHistory);
    localStorage.setItem('learnmate_sessions_v1', JSON.stringify(newHistory));
  };

  const renderActiveContent = () => {
    if (activeTab === 'new') return <LearningDashboard onSessionCreated={handleSessionCreated} />;
    if (activeTab === 'library') {
      if (selectedKnowledgeItem) {
        return (
          <KnowledgeDetailView 
            item={selectedKnowledgeItem} 
            onBack={() => setSelectedKnowledgeItem(null)} 
            onDelete={async (id) => { await knowledgeEngine.deleteItem(id); setSelectedKnowledgeItem(null); syncVaultData(); }}
            onUpdate={(updated) => { setSelectedKnowledgeItem(updated); syncVaultData(); }}
            onTeachMe={async (item) => {
              setIsTeaching(true);
              try {
                const { text, sections, sources } = await fetchExpertKnowledge(
                  `Deep Understanding: ${item.topic || 'Concept'}`, LearningLevel.ADVANCED, LearningMode.VAULT_TEACH, MentorPersonality.SOCRATIC, [item.topic || 'Concept'], [item.content]
                );
                handleSessionCreated({
                  id: crypto.randomUUID(), topic: item.topic || 'Vault Teach', level: LearningLevel.ADVANCED, mode: LearningMode.VAULT_TEACH, personality: MentorPersonality.SOCRATIC, summary: text, sections, sources, timestamp: Date.now(), quizzes: [], chatHistory: [], notes: '', highlights: [item.content], masteryScore: 0, confusionPoints: []
                });
                setSelectedKnowledgeItem(null);
              } finally { setIsTeaching(false); }
            }}
          />
        );
      }

      const filteredKnowledge = knowledgeVault.filter(item => 
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <div className="py-4 md:py-8 space-y-5 md:space-y-12 animate-in fade-in duration-700 pb-20 md:pb-24 px-2 sm:px-0">
          <div className="space-y-4 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
              <div className="space-y-3 md:space-y-6">
                <h2 className="text-2xl md:text-6xl font-serif text-white tracking-tight">The Vaults</h2>
                <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
                  <div className="relative group">
                    <select 
                      value={activeVaultId} 
                      onChange={(e) => setActiveVaultId(e.target.value)}
                      className="appearance-none bg-[#0a0a0a] border border-slate-800 text-[10px] md:text-xs text-blue-400 pl-4 pr-10 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl outline-none focus:ring-1 focus:ring-blue-500/20 font-black uppercase tracking-widest cursor-pointer shadow-xl transition-all"
                    >
                      {vaults.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500/60">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  
                  {isCreatingVault ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-500 bg-[#0a0a0a] border border-blue-500/30 p-1 rounded-xl shadow-xl">
                      <input 
                        autoFocus
                        type="text" 
                        value={newVaultName}
                        onChange={(e) => setNewVaultName(e.target.value)}
                        placeholder="Name..."
                        className="bg-transparent border-none px-3 py-1.5 text-[10px] text-white outline-none focus:ring-0 w-32 font-bold placeholder-slate-700"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateVaultConfirm()}
                      />
                      <div className="flex items-center gap-1">
                        <button onClick={handleCreateVaultConfirm} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setIsCreatingVault(false); }} className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsCreatingVault(true); }}
                      className="flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-xl active:scale-95 group"
                      title="Establish New Vault"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 md:gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="group flex items-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-2xl border border-slate-800 bg-[#080808] text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-xl">
                   <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                   IMPORT
                </button>
                <input type="file" ref={fileInputRef} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !activeVaultId) return;
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const result = await knowledgeEngine.importJSON(event.target?.result as string, getUserId(), activeVaultId);
                      showToast(`Imported ${result.added} nodes`, 'success');
                      syncVaultData();
                    } catch (err) { showToast("Import failed", 'error'); }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }} className="hidden" accept=".json" />
                <button onClick={async () => {
                   const { data, mimeType, filename } = await knowledgeEngine.generateExport('json', getUserId(), activeVaultId);
                   const blob = new Blob([data], { type: mimeType });
                   const url = URL.createObjectURL(blob);
                   const link = document.createElement('a');
                   link.href = url; link.download = filename; link.click();
                   URL.revokeObjectURL(url);
                   showToast(`Exported ✓`, 'success');
                }} className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-2xl border border-slate-800 bg-[#080808] text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-xl">
                   <svg className="w-3 h-3 md:w-4 md:h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   JSON
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter nodes..."
                className="w-full bg-[#080808] border border-slate-800 rounded-xl md:rounded-[2rem] pl-10 md:pl-16 pr-6 md:pr-8 py-3 md:py-6 text-[11px] md:text-base text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder-slate-800 shadow-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10">
            {isLoadingVault || isTeaching ? (
               <div className="col-span-full py-16 text-center">
                 <div className="relative inline-block w-8 h-8 md:w-12 md:h-12 mb-4">
                    <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
                 <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest animate-pulse">Syncing semantic link...</p>
               </div>
            ) : filteredKnowledge.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-900 rounded-[2rem] md:rounded-[4rem] bg-black/40 shadow-inner group">
                <div className="w-12 h-12 md:w-24 md:h-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 text-xl md:text-3xl">🗂️</div>
                <h3 className="text-white font-serif text-xl md:text-3xl mb-1 tracking-tight">Archive Empty</h3>
                <p className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest">Awaiting Knowledge Acquisition.</p>
              </div>
            ) : filteredKnowledge.map((item) => (
              <div 
                key={item.id} onClick={() => setSelectedKnowledgeItem(item)}
                className="p-5 md:p-10 rounded-[1.5rem] md:rounded-[3rem] bg-[#080808] border border-slate-900 hover:border-blue-600/30 hover:bg-[#0a0a0a] cursor-pointer transition-all duration-300 flex flex-col gap-4 md:gap-6 group relative overflow-hidden shadow-xl hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-24 md:w-40 h-24 md:h-40 bg-blue-600/5 rounded-full blur-[40px] md:blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start">
                  <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-[0.1em] px-2 md:px-3.5 py-1 md:py-1.5 rounded-lg md:rounded-xl border shadow-lg ${item.type === 'highlight' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400'}`}>{item.type}</span>
                  <span className="text-[8px] md:text-[10px] text-slate-700 font-bold uppercase tracking-widest tabular-nums">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex-1 space-y-1.5 md:space-y-3">
                  <h4 className="text-white font-serif text-lg md:text-2xl group-hover:text-blue-400 transition-colors leading-tight line-clamp-1">{item.topic || "Node Fragment"}</h4>
                  <p className="text-[11px] md:text-base text-slate-400 leading-relaxed font-light line-clamp-2 md:line-clamp-3 italic opacity-70 group-hover:opacity-100 transition-opacity">"{item.content}"</p>
                </div>
                <div className="flex items-center justify-between pt-3 md:pt-6 border-t border-slate-800/50">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30"></div>
                      <span className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[100px] md:max-w-[150px]">{item.source}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-blue-500">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (activeTab === 'stats') return <StatsView history={sessionHistory} vault={knowledgeVault} />;
    if (activeTab === 'active' && activeSession) return <SessionView session={activeSession} onUpdateSession={handleUpdateSession} />;
    return <LearningDashboard onSessionCreated={handleSessionCreated} />;
  };

  if (isBooting) return <SplashScreen onComplete={() => setIsBooting(false)} />;

  return (
    <div className="animate-in fade-in duration-1000">
      {toast && (
        <div className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-[200] px-6 md:px-8 py-2 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest md:tracking-[0.3em] shadow-3xl bg-blue-600 text-white animate-in fade-in slide-in-from-top-4">
          {toast.message}
        </div>
      )}
      <Layout onNewSession={startNew} history={sessionHistory} onSelectSession={handleSelectSession} activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderActiveContent()}
      </Layout>
    </div>
  );
};

// Added missing default export
export default App;

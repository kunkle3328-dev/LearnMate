
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  LearningSession, 
  ChatMessage, 
  LessonSection, 
  PodcastMetadata, 
  PodcastSegment,
  PodcastVerbosity,
  PodcastConfig,
  DialogueBlock,
  TopicSuggestion,
  SynthesisConfig,
  SynthesisDepth,
  ExplanationDensity,
  ReasoningStyle,
  EvolutionTier
} from '../types';
import { 
  summarizeSnippet, 
  generatePodcastPlan, 
  generateSegmentScriptBlocks,
  sendChatMessage,
  getAdaptiveSuggestions
} from '../services/geminiService';
import { knowledgeEngine, getUserId } from '../services/knowledgeEngine';
import { adaptiveLearning } from '../services/adaptiveLearning';
import { PodcastView } from './PodcastView';

interface Props {
  session: LearningSession;
  onUpdateSession: (updated: LearningSession) => void;
  onPivot?: (topic: string) => void;
}

const TopicSuggestionsView: React.FC<{ 
  suggestions: TopicSuggestion[]; 
  onSelect: (topic: string) => void;
}> = ({ suggestions, onSelect }) => {
  return (
    <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
        <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Recommended Next Phase</h5>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {suggestions.map((s, idx) => (
          <button 
            key={idx}
            onClick={() => onSelect(s.topic)}
            className="w-full text-left p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-600/5 transition-all group shadow-xl active:scale-95"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] md:text-xs font-black text-blue-400 group-hover:text-blue-300 truncate tracking-tight">{s.topic}</span>
              <svg className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <p className="text-[9px] md:text-[10px] text-slate-500 group-hover:text-slate-400 font-medium leading-relaxed italic line-clamp-2">
              {s.reason}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatCard: React.FC<{ 
  message: ChatMessage; 
  onSave: (content: string, topic: string) => void;
  onQuizRequest: () => void;
  onExpandDeepDive: () => void;
  onView: () => void;
}> = ({ message, onSave, onQuizRequest, onExpandDeepDive, onView }) => {
  const isModel = message.role === 'model';
  const [showDeepDive, setShowDeepDive] = useState(false);

  useEffect(() => {
    if (isModel) onView();
  }, [isModel]);

  if (!isModel) {
    return (
      <div className="flex justify-end mb-4 animate-in slide-in-from-right-2 duration-300">
        <div className="max-w-[90%] p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-500/50 text-white text-[11px] md:text-xs shadow-[0_10px_30px_rgba(37,99,235,0.2)] font-medium">
          {message.text}
        </div>
      </div>
    );
  }

  const quickAnswer = message.text.match(/Quick Answer:\s*([\s\S]*?)(?=\n\n|\nDeep Dive:|\nKey Takeaways:|$)/i)?.[1]?.trim() || message.text;
  const deepDive = message.text.match(/Deep Dive:\s*([\s\S]*?)(?=\n\n|\nKey Takeaways:|$)/i)?.[1]?.trim();
  const takeaways = message.text.match(/Key Takeaways:\s*([\s\S]*?)$/i)?.[1]?.trim();

  return (
    <div className="flex flex-col gap-3 mb-6 animate-in slide-in-from-left-2 duration-500 group">
      <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-slate-900 rounded-[1.5rem] overflow-hidden shadow-2xl hover:border-blue-500/30 transition-all">
        <div className="px-5 pt-5 pb-2 flex justify-between items-center">
           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
             Synthesis Engine
           </span>
           <div className="flex gap-2">
             <button 
                onClick={() => onSave(message.text, "Chat Insight")}
                className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-white hover:border-blue-500/30 transition-all shadow-lg active:scale-90"
                title="Save to Vault"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
             </button>
             <button 
                onClick={onQuizRequest}
                className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-lg active:scale-90"
                title="Reinforce"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </button>
           </div>
        </div>

        <div className="px-5 pb-5 md:px-6 md:pb-6">
           <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed font-light text-[11px] md:text-[14px]">
              <ReactMarkdown>{quickAnswer}</ReactMarkdown>
           </div>
        </div>

        {deepDive && (
          <div className="border-t border-slate-900">
            <button 
              onClick={() => { setShowDeepDive(!showDeepDive); if(!showDeepDive) onExpandDeepDive(); }}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-900/50 transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Technical Elaboration</span>
              <svg className={`w-4 h-4 text-slate-700 transition-transform duration-300 ${showDeepDive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {showDeepDive && (
              <div className="px-6 pb-6 pt-1 animate-in slide-in-from-top-1 duration-300 prose prose-invert prose-sm max-w-none text-slate-400 text-[11px] md:text-sm leading-relaxed italic border-l-2 border-blue-500/20 ml-5 mb-4">
                <ReactMarkdown>{deepDive}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {takeaways && (
          <div className="bg-blue-600/5 border-t border-slate-900 p-5">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">Key Takeaways</h5>
            <div className="prose prose-invert prose-sm max-w-none text-slate-400 text-[11px] md:text-sm font-medium">
               <ReactMarkdown>{takeaways}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CollapsibleSection: React.FC<{ 
  section: LessonSection; 
  idx: number; 
  onSave: (content: string, type: 'highlight' | 'paragraph' | 'summary' | 'note' | 'block', meta?: any) => void;
  onSummarize: (text: string, title: string) => void;
}> = ({ section, idx, onSave, onSummarize }) => {
  const [isOpen, setIsOpen] = useState(true);

  const extractText = (children: any): string => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(extractText).join('');
    if (children?.props?.children) return extractText(children.props.children);
    return '';
  };

  return (
    <article className="bg-[#050505] border border-slate-900 p-6 md:p-14 rounded-3xl md:rounded-[4rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:border-slate-800 transition-all group relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6 md:pb-12 mb-6 md:mb-12">
        <div className="flex items-center gap-4 flex-1 cursor-pointer select-none group/title" onClick={() => setIsOpen(!isOpen)}>
          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-2xl border border-slate-900 bg-slate-900/30 flex items-center justify-center transition-all duration-500 ${isOpen ? 'rotate-0 border-blue-500/30 text-blue-500' : '-rotate-90 text-slate-700'}`}>
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </div>
          <h2 className="text-xl md:text-5xl font-bold text-slate-100 tracking-tight leading-tight flex-1">
            <span className="text-blue-600/30 mr-3 font-mono text-base md:text-3xl">0{idx + 1}</span>
            {section.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onSummarize(section.content, section.title); }} 
            className="px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-blue-500/20 text-blue-400 bg-blue-500/5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
          >
            Summarize
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onSave(section.content, 'highlight', { section: section.title }); }} 
            className="px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-blue-500/20 text-blue-400 bg-blue-500/5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
          >
            Vault
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="prose prose-invert prose-blue max-w-none w-full animate-in fade-in duration-700">
          <ReactMarkdown components={{
            p: (props) => (
              <div className="group/p relative">
                <p className="mb-6 md:mb-12 leading-[1.8] text-slate-300 text-sm md:text-2xl font-light selection:bg-blue-600/30" {...props} />
                <button 
                  onClick={() => onSave(extractText(props.children), 'paragraph', { section: section.title })} 
                  className="absolute -right-4 md:-right-14 top-0 opacity-0 group-hover/p:opacity-100 p-2 text-blue-500 transition-all hover:scale-125 z-10 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>
            ),
            h3: (props) => <h3 className="text-lg md:text-4xl font-bold text-white mt-8 md:mt-20 mb-4 md:mb-10" {...props} />,
            ul: (props) => <ul className="list-disc pl-6 md:pl-12 mb-6 md:mb-12 space-y-3 md:space-y-8 text-slate-400 text-xs md:text-xl" {...props} />,
            pre: (props) => (
              <div className="group/code relative my-6 md:my-16 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                <pre className="bg-black p-6 md:p-14 rounded-2xl md:rounded-[3rem] border border-slate-800 text-[10px] md:text-lg text-blue-300 font-mono overflow-x-auto scrollbar-hide" {...props} />
                <button 
                  onClick={() => onSave(extractText(props.children), 'block', { section: section.title })} 
                  className="absolute top-4 right-4 opacity-100 md:opacity-0 group-hover/code:opacity-100 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 shadow-2xl hover:bg-blue-600 hover:text-white transition-all"
                >
                  Capture
                </button>
              </div>
            )
          }}>{section.content}</ReactMarkdown>
        </div>
      )}
    </article>
  );
};

export const SessionView: React.FC<Props> = ({ session, onUpdateSession, onPivot }) => {
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Podcast State
  const [podcastMetadata, setPodcastMetadata] = useState<PodcastMetadata | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [podcastStatus, setPodcastStatus] = useState('');
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig>({
    durationMin: 10,
    verbosity: PodcastVerbosity.BALANCED,
    debateLevel: 0.3,
    pacing: 'normal'
  });

  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  
  // Synthesis Config Initializer
  const synthesisConfig = session.synthesisConfig || {
    mode: 'teach',
    depth: SynthesisDepth.STANDARD,
    density: ExplanationDensity.BALANCED,
    precisionMode: false,
    lenses: { analogies: false, mechanics: false, tradeoffs: false, pitfalls: false },
    reasoningStyle: ReasoningStyle.GUIDED
  };

  const userProfile = adaptiveLearning.getProfile(getUserId());
  const isSocraticUnlocked = userProfile.evolutionTier !== EvolutionTier.EXPLORER;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const lessonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lessonContainerRef.current) {
      lessonContainerRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [session.id]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.chatHistory, isTyping]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (session.chatHistory.length >= 2 && !session.suggestions) {
        try {
          const suggestions = await getAdaptiveSuggestions(session, session.masteryScore);
          onUpdateSession({ ...session, suggestions });
        } catch (err) { console.error("Suggestions failed", err); }
      }
    };
    fetchSuggestions();
  }, [session.chatHistory.length]);

  const updateConfig = (updates: Partial<SynthesisConfig>) => {
    onUpdateSession({ 
      ...session, 
      synthesisConfig: { ...synthesisConfig, ...updates } 
    });
  };

  const toggleLens = (lens: keyof SynthesisConfig['lenses']) => {
    updateConfig({
      lenses: { ...synthesisConfig.lenses, [lens]: !synthesisConfig.lenses[lens] }
    });
    setToast({ message: `Lens: ${lens.toUpperCase()} ${synthesisConfig.lenses[lens] ? 'OFF' : 'ON'}`, type: 'success' });
    setTimeout(() => setToast(null), 1500);
  };

  const trackInteraction = (action: "view" | "save" | "followUp" | "expandDeepDive") => {
    const updatedProfile = adaptiveLearning.updateMastery(getUserId(), session.topic, action);
    const item = updatedProfile.items.find(i => i.topic === session.topic);
    if (item) {
      onUpdateSession({ ...session, masteryScore: item.mastery });
    }
  };

  const handleUnifiedSave = async (content: string, type: any = 'highlight', meta: any = {}) => {
    if (!content.trim()) return;
    try {
      const vaults = await knowledgeEngine.fetchVaults(getUserId());
      const activeVaultId = vaults[0].id;
      await knowledgeEngine.saveKnowledge({
        userId: getUserId(), vaultId: activeVaultId, type: type === 'paragraph' || type === 'summary' || type === 'block' ? 'highlight' : type,
        content: content, topic: meta.topic || session.topic, source: 'lesson', context: { ...meta, lessonId: session.id }
      });
      trackInteraction("save");
      setToast({ message: "Insight Secured ✓", type: 'success' });
      setTimeout(() => setToast(null), 2000);
    } catch (err) { setToast({ message: "Save Failed", type: 'error' }); }
  };

  const handleSummarize = async (text: string, sectionTitle: string) => {
    setIsTyping(true);
    const userMsg: ChatMessage = { role: 'user', text: `Synthesis: "${sectionTitle}".` };
    const updatedHistory = [...(session.chatHistory || []), userMsg];
    onUpdateSession({ ...session, chatHistory: updatedHistory });
    try {
      const summary = await summarizeSnippet(text);
      const modelMsg: ChatMessage = { role: 'model', text: summary };
      onUpdateSession({ ...session, chatHistory: [...updatedHistory, modelMsg] });
      handleUnifiedSave(summary, 'highlight', { topic: sectionTitle });
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    const updatedHistory = [...(session.chatHistory || []), userMsg];
    onUpdateSession({ ...session, chatHistory: updatedHistory });
    setChatInput(''); setIsTyping(true);
    trackInteraction("followUp");
    try {
      const response = await sendChatMessage(session, updatedHistory, userMsg.text);
      onUpdateSession({ ...session, chatHistory: [...updatedHistory, { role: 'model', text: response }] });
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const handleGeneratePodcast = async () => {
    if (isGeneratingPodcast) return;
    setIsGeneratingPodcast(true);
    setShowSynthesisModal(false);
    setPodcastStatus("Planning show...");
    try {
      const content = session.sections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
      const plan = await generatePodcastPlan(session.topic, content, podcastConfig);
      
      const segmentsWithScripts: PodcastSegment[] = [];
      let fullScript = "";
      let lastSummary = "";

      for (let i = 0; i < plan.segments.length; i++) {
        const seg = plan.segments[i];
        setPodcastStatus(`Synthesizing ${seg.segment} (${i+1}/${plan.segments.length})...`);
        const blocks = await generateSegmentScriptBlocks(session.topic, content, seg, podcastConfig, lastSummary);
        
        const segmentScript = blocks.map(b => `${b.speaker}: ${b.text}`).join('\n');
        segmentsWithScripts.push({ ...seg, script: segmentScript, blocks });
        fullScript += `\n\n[SEGMENT: ${seg.segment}]\n` + segmentScript;
        lastSummary = `Alex and Jordan discussed ${seg.segment}.`;
      }

      const meta: PodcastMetadata = {
        id: crypto.randomUUID(), topic: session.topic, config: podcastConfig, segments: segmentsWithScripts,
        fullScript, durationMinutes: plan.durationMinutes, 
        totalWordCount: segmentsWithScripts.reduce((acc, s) => acc + (s.script?.split(/\s+/).length || 0), 0)
      };

      setPodcastMetadata(meta);
      setToast({ message: "Podcast Ready🎙️", type: 'success' });
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error(err);
      setToast({ message: "Neural Link Interrupted", type: 'error' });
    } finally { setIsGeneratingPodcast(false); setPodcastStatus(""); }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 md:space-y-24 pb-20 md:pb-24 px-1 sm:px-0 max-w-full" ref={lessonContainerRef}>
      <div className="fixed top-0 left-0 h-1 bg-blue-600 z-[100] transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.6)]" style={{ width: `${progress}%` }} />
      
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[210] px-8 py-3.5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest bg-blue-600 text-white shadow-3xl animate-in fade-in slide-in-from-bottom-4 border border-blue-400/20">
          {toast.message}
        </div>
      )}

      {podcastMetadata && (
        <PodcastView metadata={podcastMetadata} onClose={() => setPodcastMetadata(null)} />
      )}

      {/* Synthesis Modal Overlay */}
      {showSynthesisModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowSynthesisModal(false)}></div>
          <div className="bg-[#0d0d0d] border border-blue-500/30 rounded-[3rem] p-6 md:p-14 max-w-2xl w-full max-h-[95vh] flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.9)] relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden">
             
             {/* Header */}
             <div className="flex justify-between items-start mb-6 md:mb-10 flex-shrink-0">
               <div>
                 <h2 className="text-xl md:text-4xl font-serif text-white tracking-tight">Learning Synthesis Controls</h2>
                 <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 md:mt-2 leading-relaxed">Tune how the AI reasons, explains, and challenges you.</p>
               </div>
               <button onClick={() => setShowSynthesisModal(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 hover:text-white transition-all ml-4">
                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
             </div>

             {/* Scrollable Content Area */}
             <div className="space-y-8 md:space-y-10 overflow-y-auto flex-1 pr-2 scrollbar-hide">
                {/* TEACH vs ASSESS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <button 
                    onClick={() => updateConfig({ mode: 'teach' })}
                    className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border transition-all flex flex-col gap-1.5 md:gap-2 items-start text-left group ${synthesisConfig.mode === 'teach' ? 'bg-blue-600 border-blue-400 text-white shadow-2xl' : 'bg-black border-slate-900 text-slate-600 hover:border-slate-800'}`}
                  >
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">🧠 Teach Mode</span>
                    <span className={`text-[10px] md:text-[11px] font-medium leading-relaxed ${synthesisConfig.mode === 'teach' ? 'text-blue-100' : 'text-slate-700'}`}>AI explains, guides, and builds mental models.</span>
                  </button>
                  <button 
                    onClick={() => updateConfig({ mode: 'assess' })}
                    className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border transition-all flex flex-col gap-1.5 md:gap-2 items-start text-left group ${synthesisConfig.mode === 'assess' ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl' : 'bg-black border-slate-900 text-slate-600 hover:border-slate-800'}`}
                  >
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">🧪 Assess Mode</span>
                    <span className={`text-[10px] md:text-[11px] font-medium leading-relaxed ${synthesisConfig.mode === 'assess' ? 'text-indigo-100' : 'text-slate-700'}`}>AI probes understanding and exposes gaps.</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                   {/* Depth */}
                   <div className="space-y-3">
                     <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Cognitive Depth</label>
                     <div className="grid grid-cols-2 gap-2">
                       {Object.values(SynthesisDepth).map(d => (
                         <button key={d} onClick={() => updateConfig({ depth: d })} className={`py-2.5 md:py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all ${synthesisConfig.depth === d ? 'bg-white text-black border-white' : 'bg-black border-slate-900 text-slate-700 hover:text-white'}`}>{d}</button>
                       ))}
                     </div>
                   </div>

                   {/* Density */}
                   <div className="space-y-3">
                     <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Explanation Density</label>
                     <div className="grid grid-cols-1 gap-2">
                       {Object.values(ExplanationDensity).map(d => (
                         <button key={d} onClick={() => updateConfig({ density: d })} className={`py-2.5 md:py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all ${synthesisConfig.density === d ? 'bg-white text-black border-white' : 'bg-black border-slate-900 text-slate-700 hover:text-white'}`}>{d}</button>
                       ))}
                     </div>
                   </div>
                </div>

                {/* Podcast Settings Integration */}
                <div className="space-y-6 pt-6 md:pt-8 border-t border-slate-900">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">🎙️ Audio Synthesis (Podcast Overview)</label>
                    {isGeneratingPodcast && (
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest animate-pulse">{podcastStatus}</span>
                    )}
                  </div>
                  
                  <div className="p-5 md:p-6 bg-[#0a0a0a] border border-slate-900 rounded-2xl space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">TARGET DURATION</label>
                        <span className="text-[10px] md:text-[11px] font-mono font-bold text-blue-400 tabular-nums">{podcastConfig.durationMin}min</span>
                      </div>
                      <input 
                        type="range" min="5" max="40" step="5" 
                        value={podcastConfig.durationMin} 
                        onChange={(e) => setPodcastConfig({...podcastConfig, durationMin: parseInt(e.target.value)})} 
                        className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                      />
                    </div>
                    
                    <button 
                      onClick={handleGeneratePodcast}
                      disabled={isGeneratingPodcast}
                      className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isGeneratingPodcast ? 'bg-blue-600/20 border-blue-500 text-blue-500 cursor-not-allowed' : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-xl'}`}
                    >
                      {isGeneratingPodcast ? 'SYNTHESIZING...' : 'GENERATE AUDIO OVERVIEW'}
                    </button>
                  </div>
                </div>

                {/* Precision Mode Toggle */}
                <div className="p-5 md:p-6 bg-[#0a0a0a] border border-slate-900 rounded-2xl md:rounded-3xl flex items-center justify-between group">
                  <div className="space-y-1 flex-1 pr-4">
                    <p className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest">Precision Mode (Rigor)</p>
                    <p className="text-[9px] md:text-[10px] text-slate-600 font-medium leading-relaxed">Strictly enforce definitions and correctness. No hand-waving.</p>
                  </div>
                  <button 
                    onClick={() => updateConfig({ precisionMode: !synthesisConfig.precisionMode })}
                    className={`w-12 h-6 md:w-14 md:h-7 rounded-full transition-all relative p-1 flex-shrink-0 ${synthesisConfig.precisionMode ? 'bg-emerald-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-white transition-all transform ${synthesisConfig.precisionMode ? 'translate-x-6 md:translate-x-7 shadow-lg' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Socratic reasoning toggle if unlocked */}
                {isSocraticUnlocked && (
                  <div className="space-y-4 pt-6 md:pt-8 border-t border-slate-900">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Reasoning Style Protocol</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ReasoningStyle).map(s => (
                        <button key={s} onClick={() => updateConfig({ reasoningStyle: s })} className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${synthesisConfig.reasoningStyle === s ? 'bg-blue-600 border-blue-400 text-white shadow-2xl' : 'bg-black border-slate-900 text-slate-600 hover:text-slate-400'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             {/* Footer Button - flex-shrink-0 ensures it stays visible at bottom */}
             <div className="pt-6 md:pt-10 flex-shrink-0">
               <button 
                onClick={() => { setShowSynthesisModal(false); setToast({ message: "Synthesis Config Synchronized", type: 'success' }); setTimeout(() => setToast(null), 2000); }}
                className="w-full py-5 md:py-6 bg-white text-black rounded-xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.3em] hover:bg-slate-200 transition-all shadow-3xl active:scale-[0.98]"
              >
                Apply Configuration
              </button>
             </div>
          </div>
        </div>
      )}

      {/* Hero Container */}
      <div className="bg-[#080808] border border-slate-900/50 p-6 md:p-24 rounded-3xl md:rounded-[5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex flex-col gap-8 md:gap-24 items-center relative group z-30 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 md:w-[32rem] h-64 md:h-[32rem] bg-blue-600/5 rounded-full blur-[80px] md:blur-[160px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-64 md:w-[24rem] h-64 md:h-[24rem] bg-indigo-600/5 rounded-full blur-[80px] md:blur-[140px] opacity-30"></div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full border-b border-slate-800/30 pb-8 md:pb-16 z-[50]">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="px-4 py-1.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] md:text-[11px] font-black tracking-widest uppercase shadow-inner">{session.level}</span>
            <span className="px-4 py-1.5 bg-slate-900/50 text-slate-400 border border-slate-800 rounded-xl text-[9px] md:text-[11px] font-black tracking-widest uppercase">{session.personality}</span>
            <div className="flex items-center gap-3 ml-2">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Mastery</span>
              <div className="w-20 md:w-48 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 p-0.5">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all duration-1000 rounded-full" style={{ width: `${(session.masteryScore || 0) * 100}%` }}></div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 relative w-full md:w-auto">
            <button 
              onClick={() => setShowSynthesisModal(true)} 
              className="flex-1 md:flex-none px-5 py-3 md:px-10 md:py-4.5 rounded-xl md:rounded-[2rem] text-[9px] md:text-xs font-black uppercase tracking-[0.2em] transition-all bg-black border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500/30 shadow-xl overflow-hidden relative active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap">
                {isGeneratingPodcast ? <span className="animate-pulse">🎙️ SYNTHESIZING...</span> : "🎚️ SYNTHESIS CONTROLS"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
            </button>
            <button className="flex-1 md:flex-none px-5 py-3 md:px-10 md:py-4.5 bg-gradient-to-br from-white to-slate-200 text-black rounded-xl md:rounded-[2rem] text-[9px] md:text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:to-white transition-all active:scale-95 overflow-hidden relative">
              <span className="relative z-10">EVALUATE</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>
        </div>

        <div className="w-full text-center space-y-4 md:space-y-8 z-[10]">
          <h1 className="text-3xl sm:text-5xl md:text-8xl lg:text-[10rem] font-serif text-white tracking-tight leading-none px-4 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">{session.topic}</h1>
          <div className="w-20 md:w-40 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent mx-auto rounded-full blur-[0.5px]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-24 relative z-10">
        <div className="lg:col-span-8 space-y-12 md:space-y-32">
          {/* Active Lens Toggles - Action Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <button 
              onClick={() => toggleLens('analogies')} 
              className={`flex flex-col items-center gap-3 py-6 md:py-10 px-2 rounded-2xl md:rounded-[2.5rem] border transition-all shadow-xl group active:scale-95 ${synthesisConfig.lenses.analogies ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/10 border-slate-900/50 hover:border-blue-500/30 hover:bg-blue-600/5'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-2xl ${synthesisConfig.lenses.analogies ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#080808] border-slate-800 text-blue-500'}`}>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.423 20.11L2.687 15.54c-1.14-.594-1.14-2.214 0-2.808l8.736-4.57a1.316 1.316 0 011.253 0l8.736 4.57c1.14.594 1.14 2.214 0 2.808l-8.736 4.57a1.316 1.316 0 01-1.253 0zM11.423 13.067l-8.736-4.57c-1.14-.594-1.14-2.214 0-2.808l8.736-4.57a1.316 1.316 0 011.253 0l8.736 4.57c1.14.594 1.14 2.214 0 2.808l-8.736 4.57a1.316 1.316 0 01-1.253 0z" /></svg>
              </div>
              <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-colors ${synthesisConfig.lenses.analogies ? 'text-blue-400' : 'text-slate-600 group-hover:text-blue-500'}`}>Analogies</span>
            </button>
            <button 
              onClick={() => toggleLens('mechanics')} 
              className={`flex flex-col items-center gap-3 py-6 md:py-10 px-2 rounded-2xl md:rounded-[2.5rem] border transition-all shadow-xl group active:scale-95 ${synthesisConfig.lenses.mechanics ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/10 border-slate-900/50 hover:border-blue-500/30 hover:bg-blue-600/5'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-2xl ${synthesisConfig.lenses.mechanics ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#080808] border-slate-800 text-blue-500'}`}>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477" /></svg>
              </div>
              <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-colors ${synthesisConfig.lenses.mechanics ? 'text-blue-400' : 'text-slate-600 group-hover:text-blue-500'}`}>Mechanics</span>
            </button>
            <button 
              onClick={() => toggleLens('tradeoffs')} 
              className={`flex flex-col items-center gap-3 py-6 md:py-10 px-2 rounded-2xl md:rounded-[2.5rem] border transition-all shadow-xl group active:scale-95 ${synthesisConfig.lenses.tradeoffs ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/10 border-slate-900/50 hover:border-blue-500/30 hover:bg-blue-600/5'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-2xl ${synthesisConfig.lenses.tradeoffs ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#080808] border-slate-800 text-blue-500'}`}>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              </div>
              <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-colors ${synthesisConfig.lenses.tradeoffs ? 'text-blue-400' : 'text-slate-600 group-hover:text-blue-500'}`}>Tradeoffs</span>
            </button>
            <button 
              onClick={() => toggleLens('pitfalls')} 
              className={`flex flex-col items-center gap-3 py-6 md:py-10 px-2 rounded-2xl md:rounded-[2.5rem] border transition-all shadow-xl group active:scale-95 ${synthesisConfig.lenses.pitfalls ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/10 border-slate-900/50 hover:border-blue-500/30 hover:bg-blue-600/5'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-2xl ${synthesisConfig.lenses.pitfalls ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#080808] border-slate-800 text-blue-500'}`}>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              </div>
              <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-colors ${synthesisConfig.lenses.pitfalls ? 'text-blue-400' : 'text-slate-600 group-hover:text-blue-500'}`}>Pitfalls</span>
            </button>
          </div>
          <div className="space-y-12 md:space-y-32">
            {session.sections.map((section, idx) => (
              <CollapsibleSection key={idx} idx={idx} section={section} onSave={handleUnifiedSave} onSummarize={handleSummarize} />
            ))}
          </div>
        </div>
        
        <aside className="lg:col-span-4 space-y-8 sticky top-24 self-start max-h-screen overflow-hidden flex flex-col pb-20">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl border border-slate-900 p-5 md:p-10 rounded-3xl md:rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col h-[55vh] md:h-[78vh]">
            <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-600 mb-6 flex justify-between items-center border-b border-slate-900 pb-4">
              Neural Terminal
              {isTyping && <div className="flex gap-1.5"><div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(37,99,235,1)]"></div><div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-75 shadow-[0_0_8px_rgba(37,99,235,1)]"></div><div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-150 shadow-[0_0_8px_rgba(37,99,235,1)]"></div></div>}
            </h4>
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 scrollbar-hide pr-1">
              {session.chatHistory.map((m, i) => (
                <ChatCard 
                  key={i} 
                  message={m} 
                  onSave={(c, t) => handleUnifiedSave(c, 'highlight', { topic: t })} 
                  onQuizRequest={() => handleSendMessage({ preventDefault: () => {} } as any)}
                  onExpandDeepDive={() => trackInteraction("expandDeepDive")}
                  onView={() => trackInteraction("view")}
                />
              ))}

              {session.suggestions && session.suggestions.length > 0 && (
                <TopicSuggestionsView 
                  suggestions={session.suggestions} 
                  onSelect={(topic) => {
                    if (onPivot) onPivot(topic);
                    else setChatInput(`Tell me about ${topic}`);
                  }} 
                />
              )}
              
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="relative group/input pt-2">
               <input 
                  type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Inquire with depth..." 
                  className="w-full bg-black border border-slate-800/80 rounded-2xl px-5 py-4 text-xs md:text-sm text-white focus:border-blue-600 outline-none transition-all placeholder-slate-900 shadow-inner group-hover/input:border-slate-700" 
                />
               <button type="submit" className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-90">
                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
               </button>
            </form>
          </div>
          
          <div className="bg-[#0a0a0a]/50 backdrop-blur-2xl border border-slate-900/50 p-6 md:p-10 rounded-3xl md:rounded-[3rem] shadow-2xl">
            <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-600 mb-5">Vault Fragment Stream</h4>
            <div className="space-y-3 max-h-[18vh] overflow-y-auto scrollbar-hide">
              {session.highlights.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-900 rounded-3xl flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-800 text-sm">∅</div>
                   <p className="text-[9px] text-slate-800 font-black uppercase tracking-widest text-center italic">No Synced Context</p>
                </div>
              ) : session.highlights.map((h, i) => (
                <div key={i} className="bg-black/50 border border-slate-900 p-4 rounded-xl text-[10px] text-slate-400 italic font-medium leading-relaxed hover:border-blue-500/30 transition-all cursor-default relative overflow-hidden group/item">
                  <div className="absolute left-0 top-0 w-1 h-full bg-blue-600/30" />
                  "{h.substring(0, 80)}{h.length > 80 ? '...' : ''}"
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

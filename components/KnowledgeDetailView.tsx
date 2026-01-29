
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { KnowledgeItem } from '../types';
import { knowledgeEngine } from '../services/knowledgeEngine';

interface Props {
  item: KnowledgeItem;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdate: (item: KnowledgeItem) => void;
  onTeachMe: (item: KnowledgeItem) => void;
}

export const KnowledgeDetailView: React.FC<Props> = ({ item, onBack, onDelete, onUpdate, onTeachMe }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [editTopic, setEditTopic] = useState(item.topic || '');
  const [tagInput, setTagInput] = useState('');
  const [linkedItems, setLinkedItems] = useState<KnowledgeItem[]>([]);

  useEffect(() => {
    // Fetch linked items info
    const fetchLinks = async () => {
      if (item.links && item.links.length > 0) {
        const items = await Promise.all(
          item.links.map(id => knowledgeEngine.getItemById(id))
        );
        setLinkedItems(items.filter((i): i is KnowledgeItem => i !== null));
      } else {
        setLinkedItems([]);
      }
    };
    fetchLinks();
  }, [item.links]);

  const handleSave = async () => {
    try {
      const updated = await knowledgeEngine.updateItem(item.id, {
        content: editContent,
        topic: editTopic,
        tags: item.tags
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTags = [...(item.tags || []), tagInput.trim()];
    knowledgeEngine.updateItem(item.id, { tags: Array.from(new Set(newTags)) }).then(onUpdate);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = (item.tags || []).filter(t => t !== tagToRemove);
    knowledgeEngine.updateItem(item.id, { tags: newTags }).then(onUpdate);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-5xl mx-auto py-8 md:py-16 px-4 md:px-0 w-full overflow-x-hidden">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 md:mb-20 gap-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-4 text-slate-500 hover:text-white transition-all group w-fit"
        >
          <div className="w-10 h-10 rounded-2xl border border-slate-900 bg-slate-900/30 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-600/10 transition-all duration-500 shadow-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.4em]">Back to Archive</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => onTeachMe(item)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:to-blue-500 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(37,99,235,0.3)] active:scale-95"
          >
            Teach Me This 🧠
          </button>
          <button 
            onClick={() => { if(isEditing) handleSave(); else setIsEditing(true); }}
            className={`px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl active:scale-95 ${
              isEditing ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {isEditing ? 'Sync Intelligence' : 'Refine Fragment'}
          </button>
          <button 
            onClick={() => { if(confirm("Purge this intelligence?")) onDelete(item.id); }}
            className="w-12 h-12 rounded-2xl bg-red-950/20 border border-red-900/30 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-xl active:scale-95 group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.34 7m-4.72 0l-.34-7m4.74-3.37L13.73 4h-3.46L8.26 5.63m10.23 2.13l-.86 13.04c-.06.83-.75 1.48-1.58 1.48H7.95c-.83 0-1.52-.65-1.58-1.48l-.86-13.04M9 9h6" /></svg>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="mb-12 md:mb-20 space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-lg ${
            item.type === 'highlight' ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {item.type}
          </span>
          <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] px-2">
            {item.source}
          </span>
          <div className="h-4 w-px bg-slate-800/50"></div>
          <span className="text-[10px] text-slate-700 font-mono font-bold tracking-widest">
            SYN_DT_{new Date(item.createdAt).getTime()}
          </span>
        </div>
        
        {isEditing ? (
          <input 
            type="text" 
            value={editTopic}
            onChange={(e) => setEditTopic(e.target.value)}
            className="w-full bg-black border-b border-slate-800 text-3xl md:text-7xl font-serif text-white tracking-tight leading-tight focus:border-blue-500 outline-none pb-4 transition-all"
            placeholder="Fragment Title..."
          />
        ) : (
          <h1 className="text-3xl md:text-8xl font-serif text-white tracking-tight leading-tight break-words drop-shadow-2xl">
            {item.topic || "Knowledge Fragment"}
          </h1>
        )}
      </div>

      {/* Tags Section */}
      <div className="mb-12 flex flex-wrap gap-3 items-center">
        {(item.tags || []).map(tag => (
          <span key={tag} className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-5 py-2.5 rounded-2xl text-[10px] text-slate-400 font-black uppercase tracking-widest group shadow-lg">
            #{tag}
            <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all font-sans text-lg leading-none">&times;</button>
          </span>
        ))}
        <div className="flex items-center ml-2">
          <input 
            type="text" 
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="+ APPEND_TAG"
            className="bg-transparent border-none text-[10px] text-blue-600 font-black focus:ring-0 w-32 outline-none uppercase tracking-widest placeholder-slate-800"
          />
        </div>
      </div>

      {/* Reader / Editor Experience */}
      <div className="bg-[#080808]/50 backdrop-blur-2xl border border-slate-900 p-8 md:p-24 rounded-[3rem] md:rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group w-full border-t-slate-800/50">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none opacity-50"></div>
        
        <div className="relative z-10 w-full">
          {isEditing ? (
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[60vh] bg-transparent text-slate-300 font-light text-xl md:text-4xl leading-relaxed outline-none resize-none border-none selection:bg-blue-600/30 placeholder-slate-900"
              placeholder="Refine this intelligence fragment..."
            />
          ) : (
            <div className="prose prose-invert prose-blue max-w-none w-full overflow-hidden">
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="text-lg md:text-3xl text-slate-300 font-light leading-[1.7] mb-8 md:mb-16 selection:bg-blue-600/30 break-words" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <div className="border-l-4 border-blue-600 pl-6 md:pl-12 my-10 md:my-20 italic text-slate-400 text-xl md:text-2xl break-words font-medium leading-relaxed" {...props} />
                  ),
                  pre: ({node, ...props}) => (
                    <pre className="bg-black/80 border border-slate-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] my-10 md:my-24 overflow-hidden whitespace-pre-wrap break-all text-sm md:text-2xl font-mono text-blue-300 shadow-3xl" {...props} />
                  ),
                  code: ({node, ...props}) => (
                    <code className="bg-blue-950/40 border border-slate-800/50 px-2.5 py-1 rounded-lg text-blue-400 font-mono text-sm md:text-xl break-all" {...props} />
                  )
                }}
              >
                {item.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Linked Items */}
      {linkedItems.length > 0 && (
        <div className="mt-20 md:mt-32 space-y-8">
          <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-700 px-4">Neural Graph Connections</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {linkedItems.map(linked => (
              <button 
                key={linked.id} 
                className="p-8 bg-slate-900/20 border border-slate-900 rounded-[2.5rem] hover:border-blue-500/30 transition-all text-left group shadow-xl active:scale-98"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{linked.topic || 'SYN_NODE'}</p>
                </div>
                <p className="text-sm md:text-lg text-slate-400 line-clamp-2 italic font-light group-hover:text-slate-300 transition-colors">"{linked.content}"</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Section */}
      {item.context && Object.keys(item.context).length > 0 && (
        <div className="mt-20 md:mt-32 p-10 md:p-20 bg-[#050505] border border-slate-900 rounded-[3rem] md:rounded-[5rem] shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-700 mb-10 md:mb-16">Intelligence Provenance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
            {Object.entries(item.context).map(([key, value]) => (
              <div key={key} className="space-y-3 overflow-hidden group">
                <p className="text-[9px] font-black text-blue-900 uppercase tracking-[0.4em] group-hover:text-blue-600 transition-colors">{key}</p>
                <div className="p-5 bg-black rounded-2xl border border-slate-900/50 shadow-inner">
                  <p className="text-[11px] md:text-sm text-slate-500 font-mono break-all leading-relaxed">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

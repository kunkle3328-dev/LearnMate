
import { KnowledgeItem, SaveIntent, Vault } from '../types';

const STORAGE_KEY = 'unified_knowledge_store_v1';
const VAULTS_KEY = 'learnmate_vaults_v1';
const MOCK_LATENCY = 150;

export const getUserId = () => {
  let id = localStorage.getItem('learnmate_user_id');
  if (!id) {
    id = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('learnmate_user_id', id);
  }
  return id;
};

const hashContent = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const knowledgeEngine = {
  
  async fetchVaults(userId: string): Promise<Vault[]> {
    const raw = localStorage.getItem(VAULTS_KEY);
    let vaults: Vault[] = raw ? JSON.parse(raw) : [];
    vaults = vaults.filter(v => v.userId === userId);
    
    if (vaults.length === 0) {
      const defaultVault = await this.saveVault({
        userId,
        name: "General Knowledge",
        description: "Your primary learning domain."
      });
      return [defaultVault];
    }
    return vaults;
  },

  async saveVault(params: { userId: string, name: string, description?: string, topicHints?: string[] }): Promise<Vault> {
    const vaults = this.getVaultsRaw();
    const vault: Vault = {
      id: crypto.randomUUID(),
      userId: params.userId,
      name: params.name,
      description: params.description,
      topicHints: params.topicHints || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    vaults.push(vault);
    localStorage.setItem(VAULTS_KEY, JSON.stringify(vaults));
    return vault;
  },

  getVaultsRaw(): Vault[] {
    const raw = localStorage.getItem(VAULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async deleteVault(id: string): Promise<void> {
    const vaults = this.getVaultsRaw().filter(v => v.id !== id);
    localStorage.setItem(VAULTS_KEY, JSON.stringify(vaults));
    // Also cleanup items in that vault?
    const items = this.getAllRaw().filter(i => i.vaultId !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  async saveKnowledge(intent: SaveIntent): Promise<KnowledgeItem> {
    if (!intent.userId) throw new Error("CRITICAL: Missing User ID");
    if (!intent.vaultId) throw new Error("CRITICAL: Missing Vault ID");
    if (!intent.content?.trim()) throw new Error("REJECTED: Empty content");

    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY));

    const item: KnowledgeItem = {
      id: crypto.randomUUID(),
      ...intent,
      createdAt: Date.now(),
      tags: intent.tags || [],
      links: []
    };

    const existing = this.getAllRaw();
    const updated = [item, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return item;
  },

  async updateItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const all = this.getAllRaw();
    const index = all.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Item not found");

    const updatedItem = {
      ...all[index],
      ...updates,
      updatedAt: Date.now(),
      edited: true
    };

    all[index] = updatedItem;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updatedItem;
  },

  async fetchKnowledge(userId: string, vaultId?: string): Promise<KnowledgeItem[]> {
    const all = this.getAllRaw();
    let filtered = all.filter(item => item.userId === userId);
    if (vaultId) {
      filtered = filtered.filter(item => item.vaultId === vaultId);
    }
    return filtered;
  },

  async getItemById(id: string): Promise<KnowledgeItem | null> {
    return this.getAllRaw().find(item => item.id === id) || null;
  },

  getAllRaw(): KnowledgeItem[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  },

  async deleteItem(id: string): Promise<void> {
    const all = this.getAllRaw().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  async generateExport(format: 'json' | 'markdown', userId: string, vaultId?: string): Promise<{ data: string, mimeType: string, filename: string }> {
    const items = await this.fetchKnowledge(userId, vaultId);
    if (format === 'json') {
      return {
        data: JSON.stringify({ meta: { exportedAt: new Date().toISOString(), userId }, items }, null, 2),
        mimeType: 'application/json',
        filename: `vault-${vaultId || 'all'}-${Date.now()}.json`
      };
    } else {
      let md = `# Vault Export\n\n`;
      items.forEach(item => {
        md += `## ${item.topic || 'Fragment'}\n${item.content}\n\n---\n\n`;
      });
      return {
        data: md,
        mimeType: 'text/markdown',
        filename: `vault-${vaultId || 'all'}-${Date.now()}.md`
      };
    }
  },

  async importJSON(jsonStr: string, userId: string, vaultId: string): Promise<{ added: number, skipped: number, total: number }> {
    const payload = JSON.parse(jsonStr);
    const existing = this.getAllRaw();
    const existingHashes = new Set(existing.filter(i => i.userId === userId).map(i => hashContent(i.content)));
    let added = 0, skipped = 0;
    const newItems: KnowledgeItem[] = [];

    for (const item of payload.items) {
      if (existingHashes.has(hashContent(item.content))) {
        skipped++;
        continue;
      }
      newItems.push({
        ...item,
        id: crypto.randomUUID(),
        userId,
        vaultId,
        createdAt: item.createdAt || Date.now()
      });
      added++;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...newItems, ...existing]));
    return { added, skipped, total: payload.items.length };
  }
};

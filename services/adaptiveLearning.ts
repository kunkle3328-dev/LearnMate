
import { UserKnowledgeProfile, TopicProgress, EvolutionTier, EvolutionProgress } from "../types";

const PROFILE_KEY = 'learnmate_knowledge_profile_v1';

const DEFAULT_EVOLUTION: EvolutionProgress = {
  currentTopic: "",
  inquiryCount: 0,
  vaultSaveCount: 0,
  sessionsCompleted: 0
};

export const adaptiveLearning = {
  getProfile(userId: string): UserKnowledgeProfile {
    const raw = localStorage.getItem(`${PROFILE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
    return { 
      userId, 
      items: [], 
      evolutionTier: EvolutionTier.EXPLORER,
      totalSaves: 0,
      totalFollowUps: 0,
      totalDeepDives: 0,
      evolutionProgress: { ...DEFAULT_EVOLUTION }
    };
  },

  saveProfile(profile: UserKnowledgeProfile) {
    localStorage.setItem(`${PROFILE_KEY}_${profile.userId}`, JSON.stringify(profile));
  },

  updateMastery(userId: string, topic: string, action: "view" | "save" | "followUp" | "expandDeepDive"): UserKnowledgeProfile {
    const profile = this.getProfile(userId);
    let item = profile.items.find(i => i.topic === topic);
    
    if (!item) {
      item = { topic, mastery: 0, lastReviewed: Date.now(), interactions: 0 };
      profile.items.push(item);
    }

    item.interactions += 1;
    item.lastReviewed = Date.now();

    // DETERMINISTIC TRACKING: If the user stays on the same topic, we track depth.
    // If they switch, we log the previous depth and reset for the new topic.
    if (profile.evolutionProgress.currentTopic !== topic) {
      profile.evolutionProgress.currentTopic = topic;
      profile.evolutionProgress.inquiryCount = 0;
      profile.evolutionProgress.vaultSaveCount = 0;
      profile.evolutionProgress.sessionsCompleted += 1;
    }

    // Interaction Weights (Production Architecture)
    switch (action) {
      case "view":
        item.mastery = Math.min(item.mastery + 0.04, 1);
        break;
      case "save":
        item.mastery = Math.min(item.mastery + 0.12, 1);
        profile.totalSaves += 1;
        // Persistence Signal
        profile.evolutionProgress.vaultSaveCount += 1;
        break;
      case "followUp":
        item.mastery = Math.min(item.mastery + 0.15, 1);
        profile.totalFollowUps += 1;
        // Depth Signal
        profile.evolutionProgress.inquiryCount += 1;
        break;
      case "expandDeepDive":
        item.mastery = Math.min(item.mastery + 0.08, 1);
        profile.totalDeepDives += 1;
        // Depth Signal
        profile.evolutionProgress.inquiryCount += 1;
        break;
    }

    this.saveProfile(profile);
    return profile;
  },

  upgradeTier(userId: string): UserKnowledgeProfile {
    const profile = this.getProfile(userId);
    const tiers = Object.values(EvolutionTier);
    const currentIndex = tiers.indexOf(profile.evolutionTier);
    if (currentIndex < tiers.length - 1) {
      profile.evolutionTier = tiers[currentIndex + 1];
    }
    // Protocol Unlocked: Reset progression counters for the next tier's requirements
    profile.evolutionProgress = { ...DEFAULT_EVOLUTION };
    this.saveProfile(profile);
    return profile;
  },

  getEvolutionSignals(profile: UserKnowledgeProfile) {
    const topics = profile.items.length;
    // Signal 1: Depth (Average follow-up intensity)
    const avgDepth = topics > 0 ? (profile.totalFollowUps + profile.totalDeepDives) / topics : 0;
    // Signal 2: Velocity (Mastery speed)
    const totalMastery = profile.items.reduce((acc, i) => acc + i.mastery, 0);
    const masteryVelocity = topics > 0 ? totalMastery / topics : 0;
    // Signal 3: Usage (Vault archival rate)
    const vaultUsageRate = profile.totalSaves > 0 && topics > 0 ? profile.totalSaves / topics : 0;

    // NEXT EVOLUTION DETERMINISTIC RULES
    let nextTierReady = false;
    let progressPercent = 0;
    let inquiryThreshold = 3;
    let vaultThreshold = 1;

    if (profile.evolutionTier === EvolutionTier.EXPLORER) {
      inquiryThreshold = 3;
      vaultThreshold = 1;
      const inquiryProg = Math.min(profile.evolutionProgress.inquiryCount / inquiryThreshold, 1);
      const vaultProg = profile.evolutionProgress.vaultSaveCount >= vaultThreshold ? 1 : 0;
      progressPercent = (inquiryProg * 70) + (vaultProg * 30);
      nextTierReady = profile.evolutionProgress.inquiryCount >= inquiryThreshold && profile.evolutionProgress.vaultSaveCount >= vaultThreshold;
    } else if (profile.evolutionTier === EvolutionTier.STRUCTURED_LEARNER) {
      inquiryThreshold = 5;
      vaultThreshold = 2;
      const inquiryProg = Math.min(profile.evolutionProgress.inquiryCount / inquiryThreshold, 1);
      const vaultProg = Math.min(profile.evolutionProgress.vaultSaveCount / vaultThreshold, 1);
      progressPercent = (inquiryProg * 60) + (vaultProg * 40);
      nextTierReady = profile.evolutionProgress.inquiryCount >= inquiryThreshold && profile.evolutionProgress.vaultSaveCount >= vaultThreshold;
    } else if (profile.evolutionTier === EvolutionTier.SOCRATIC_THINKER) {
      inquiryThreshold = 8;
      vaultThreshold = 4;
      const inquiryProg = Math.min(profile.evolutionProgress.inquiryCount / inquiryThreshold, 1);
      const vaultProg = Math.min(profile.evolutionProgress.vaultSaveCount / vaultThreshold, 1);
      progressPercent = (inquiryProg * 50) + (vaultProg * 50);
      nextTierReady = profile.evolutionProgress.inquiryCount >= inquiryThreshold && profile.evolutionProgress.vaultSaveCount >= vaultThreshold;
    }

    return { 
      avgDepth, 
      masteryVelocity, 
      vaultUsageRate, 
      nextTierReady, 
      progressPercent,
      inquiryCount: profile.evolutionProgress.inquiryCount,
      vaultSaveCount: profile.evolutionProgress.vaultSaveCount,
      currentTopic: profile.evolutionProgress.currentTopic,
      inquiryThreshold,
      vaultThreshold
    };
  },

  getMasteryForTopic(userId: string, topic: string): number {
    const profile = this.getProfile(userId);
    const item = profile.items.find(i => i.topic === topic);
    return item ? item.mastery : 0;
  }
};

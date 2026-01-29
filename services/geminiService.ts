
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { 
  LearningLevel, 
  LearningMode, 
  MentorPersonality, 
  QuizQuestion, 
  ChatMessage, 
  LessonSection, 
  LearningSession, 
  PodcastMetadata, 
  PodcastSegment, 
  PodcastVerbosity, 
  PodcastConfig, 
  DialogueBlock, 
  TopicSuggestion,
  EvolutionTier,
  SynthesisConfig,
  ReasoningStyle,
  SynthesisDepth,
  ExplanationDensity
} from '../types';
import { adaptiveLearning } from "./adaptiveLearning";
import { getUserId } from "./knowledgeEngine";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("JSON Parse Error:", e, text);
    return null;
  }
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * 🎙️ PODCAST ENGINE
 */

export const generatePodcastPlan = async (
  topic: string, 
  content: string, 
  config: PodcastConfig
): Promise<{ segments: PodcastSegment[], durationMinutes: number }> => {
  const ai = getAI();
  const plannerResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an elite podcast producer.
    
    GOAL: Create a show plan for EXACTLY ${config.durationMin} minutes.
    Total Target Words: ${config.durationMin * 160} words.
    
    Topic: ${topic}
    Context: ${content.substring(0, 10000)}
    
    Return JSON: { segments: [{segment, duration, lead, goal, targetWordCount, emotion}], durationMinutes }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  const plan = extractJson(plannerResponse.text);
  if (!plan) throw new Error("Podcast planning failed.");
  return plan;
};

export const generateSegmentScriptBlocks = async (
  topic: string,
  content: string,
  segment: PodcastSegment,
  config: PodcastConfig,
  previousSummary: string = ""
): Promise<DialogueBlock[]> => {
  const ai = getAI();
  const scriptResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Write natural dialogue between Alex (Expert) and Jordan (Co-host).
    SEGMENT: ${segment.segment}
    TARGET WORDS: ${segment.targetWordCount}
    TOPIC: ${topic}
    PREVIOUS: ${previousSummary}
    
    Alex: Expert, Analogies, Calm.
    Jordan: Curious, Interjects ("Right", "Wait—"), Micro-reactions.
    
    Return JSON Array: [{ speaker: "Alex"|"Jordan", text: string }]`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  return extractJson(scriptResponse.text) || [];
};

export const synthesizePodcastAudio = async (script: string): Promise<Uint8Array | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script.substring(0, 4000) }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Alex', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: 'Jordan', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
          ]
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? decodeBase64(base64Audio) : null;
};

/**
 * 🧠 COGNITIVE BEHAVIOR MATRIX
 */
const BEHAVIOR_MATRIX = {
  [EvolutionTier.EXPLORER]: {
    instruction: "Focus on intuitive, clear explanations. Use mental models for beginners. Give direct answers.",
    format: "Quick Answer, Deep Dive, Key Takeaways"
  },
  [EvolutionTier.STRUCTURED_LEARNER]: {
    instruction: "Provide comprehensive structural context. Explain tradeoffs and historical context. Be thorough but direct.",
    format: "Structural Context, Mechanism, Tradeoffs, Key Takeaways"
  },
  [EvolutionTier.SOCRATIC_THINKER]: {
    instruction: "SOCRATIC MODE ACTIVE: Do not provide immediate direct answers. Instead, ask probing questions that guide the user to their own conclusions. Reveal the truth progressively. Test their assumptions. Sound like a senior research mentor who wants the student to think for themselves.",
    format: "Intuition Nudge, Probing Question, Mechanism Hint, Potential Failure Modes"
  },
  [EvolutionTier.SYSTEMS_MASTER]: {
    instruction: "SYSTEMS THINKING MODE: Link concepts across domains. Discuss emergent properties, feedback loops, and multi-domain implications. Use high-level abstractions.",
    format: "System Architecture, Emergent Properties, Multi-Domain Link, Socratic Probe"
  }
};

/**
 * 🧠 ADAPTIVE EXPERT CHAT (PRODUCTION V8)
 */

export const sendChatMessage = async (
  session: LearningSession,
  history: ChatMessage[],
  newMessage: string,
  tutorAction?: 'analogy' | 'deeper' | 'different' | 'test' | 'quiz'
): Promise<string> => {
  const ai = getAI();
  const userId = getUserId();
  const profile = adaptiveLearning.getProfile(userId);
  const mastery = adaptiveLearning.getMasteryForTopic(userId, session.topic);
  
  // Default Config if missing
  const config = session.synthesisConfig || {
    mode: 'teach',
    depth: SynthesisDepth.STANDARD,
    density: ExplanationDensity.BALANCED,
    precisionMode: false,
    lenses: { analogies: false, mechanics: false, tradeoffs: false, pitfalls: false },
    reasoningStyle: ReasoningStyle.GUIDED
  };

  // Adaptive behavior selection from EARNED tier
  const behavior = BEHAVIOR_MATRIX[profile.evolutionTier];
  
  // Cognitive Lenses Injections
  let lensInstruction = "";
  if (config.lenses.analogies) lensInstruction += "FORCE ANALOGY: Use vivid metaphors and analogies to explain concepts.\n";
  if (config.lenses.mechanics) lensInstruction += "FORCE MECHANICS: Deeply explain the internal mechanisms and 'how it works' details.\n";
  if (config.lenses.tradeoffs) lensInstruction += "FORCE TRADEOFFS: Compare alternatives and explain the costs/benefits of this approach.\n";
  if (config.lenses.pitfalls) lensInstruction += "FORCE PITFALLS: Highlight common mistakes, edge cases, and failure modes.\n";

  // Mode & Style Adjustments
  const modeInstruction = config.mode === 'assess' 
    ? "MODE: ASSESS. Focus on probing the user's understanding. Ask more questions than you answer. Expose gaps in their knowledge." 
    : "MODE: TEACH. Focus on structured delivery and clear explanation.";
  
  const reasoningStyleInstruction = config.reasoningStyle === ReasoningStyle.SOCRATIC 
    ? "STYLE: SOCRATIC. Strictly delay direct answers. Force the user to reason first." 
    : config.reasoningStyle === ReasoningStyle.CHALLENGE
    ? "STYLE: CHALLENGE. Actively challenge the user's assumptions and push back on loose thinking."
    : "STYLE: GUIDED. Helpful, patient mentorship.";

  const precisionInstruction = config.precisionMode 
    ? "PRECISION MODE ON: Enforce rigorous definitions. Challenge assumptions. No hand-wavy explanations. Use formal terminology."
    : "";

  // Mastery level refine for prompt context
  const masteryLevelDescription = 
    mastery < 0.3 ? "Early Acquisition" :
    mastery < 0.7 ? "Structural Development" :
    "Advanced Mastery (Requires rigorous peer-level challenge)";

  // Context Retrieval (Vault + Lesson + History)
  const historyContext = history.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Expert'}: ${m.text}`).join('\n');
  const vaultContext = session.highlights.length > 0 
    ? `USER VAULT FRAGMENTS:\n${session.highlights.slice(-10).join('\n')}` 
    : "No previous vault fragments.";
  
  const currentLessonContext = session.sections.map(s => `## ${s.title}\n${s.content.substring(0, 400)}`).join('\n');

  const finalPrompt = `
You are an Expert Companion AI operating in ${config.mode.toUpperCase()} mode.

[EVOLUTION STATUS]
Earned Tier: ${profile.evolutionTier}
Cognitive Protocol: ${behavior.instruction}
Current Mastery: ${masteryLevelDescription} (${mastery.toFixed(2)})

[SYNTHESIS CONTROLS]
Depth: ${config.depth}
Density: ${config.density}
${modeInstruction}
${reasoningStyleInstruction}
${precisionInstruction}
${lensInstruction}

[CONTEXT]
${vaultContext}
${currentLessonContext}

[HISTORY]
${historyContext}

USER INPUT: "${newMessage}"

RESPONSE FORMAT (STRICT):
${behavior.format.split(', ').map(section => `${section}:`).join('\n\n')}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: finalPrompt,
    config: {
      systemInstruction: "You are a personalized learning engine. Speak with calm authority. Prefer precision over verbosity. Distinguish facts, interpretations, and assumptions. Ground everything in provided sources.",
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  return response.text || "Neural link interrupted.";
};

/**
 * 🧭 ADAPTIVE LEARNING PATHS & SUGGESTIONS
 */

export const getAdaptiveSuggestions = async (
  session: LearningSession,
  mastery: number
): Promise<TopicSuggestion[]> => {
  const ai = getAI();
  
  const strategy = 
    mastery < 0.4 ? "REINFORCEMENT: Focus on core fundamentals." :
    mastery > 0.7 ? "EXPANSION: Focus on advanced application and edge cases." :
    "STRENGTHENING: Focus on tradeoffs and structural development.";

  const prompt = `
    Analyze progress on '${session.topic}'.
    Mastery: ${mastery.toFixed(2)}
    Strategy: ${strategy}
    Summary: ${session.summary.substring(0, 800)}
    
    Suggest 3 "Next Phase" topics based on current mastery velocity.
    Return JSON Array: [{ "topic": string, "reason": string, "targetMastery": number }]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return extractJson(response.text) || [];
};

/**
 * CORE SYNTHESIS SERVICES
 */

export const fetchExpertKnowledge = async (
  topic: string, 
  level: LearningLevel, 
  mode: LearningMode,
  personality: MentorPersonality,
  expandedTopics: string[],
  vaultItems: string[] = []
) => {
  const ai = getAI();
  const context = `TOPIC: ${topic}\nLEVEL: ${level}\nMODE: ${mode}\nVAULT ITEMS: ${JSON.stringify(vaultItems.slice(0, 20))}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: context + "\n\nSynthesize an expert-level lesson. Use ## for titles.",
    config: {
      systemInstruction: "You are a master researcher. Ground everything in search and primary evidence. Be comprehensive and intellectualy honest.",
      tools: mode === LearningMode.VAULT_TEACH ? [] : [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 24576 } 
    },
  });

  const rawText = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri || "#",
    }))
    .filter((s: any) => s.uri !== "#");

  const sections: LessonSection[] = [];
  const parts = rawText.split(/^##\s+/m);
  parts.forEach(part => {
    if (!part.trim()) return;
    const lines = part.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    if (title && content) sections.push({ title, content });
  });

  return { text: rawText, sections, sources };
};

export const summarizeSnippet = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize technical snippet. Max 4 bullets.\n\n${text}`,
  });
  return response.text || "Summary failed.";
};

export const expandQuery = async (topic: string): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Topic: "${topic}". 5 sub-topics. JSON Array.`,
    config: { responseMimeType: "application/json" }
  });
  return extractJson(response.text) || [topic];
};

export const generateQuiz = async (topic: string, context: string): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `JSON Quiz for ${topic}. Context: ${context.substring(0, 3000)}`,
    config: { responseMimeType: "application/json" }
  });
  return extractJson(response.text) || [];
};

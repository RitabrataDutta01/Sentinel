import { create } from 'zustand'

/**
 * Holds the active interview session: setup choices, message history,
 * live streaming buffer, and the current (hidden) mood — mirrors what
 * POST /api/start and the /api/chat SSE stream produce.
 */
export const useSessionStore = create((set, get) => ({
  sessionId: null,
  setup: null,          // { scenario, personality, context, brutal }
  messages: [],         // [{ role: 'user' | 'ai', content: string }]
  currentMood: 5,        // confirmed: 1-10 int (1 = coldest/hostile, 10 = warmest/impressed)
  moodHistory: [],       // [{ turnIndex, mood, fillerAnalysis }] — for the Report mood timeline
  isStreaming: false,
  streamingText: '',
  terminated: false,
  terminationReason: null,
  durationSec: null,       // elapsed interview time, captured when the session ends

  startSession({ sessionId, setup }) {
    set({ sessionId, setup, messages: [], currentMood: 5, moodHistory: [], terminated: false, terminationReason: null, durationSec: null })
  },

  addUserMessage(content) {
    set((s) => ({ messages: [...s.messages, { role: 'user', content }] }))
  },

  beginAiStream() {
    set({ isStreaming: true, streamingText: '' })
  },

  appendAiToken(token) {
    set((s) => ({ streamingText: s.streamingText + token }))
  },

  /** Called on the SSE "metadata" frame: { full_text, filler_analysis, new_mood } */
  applyMoodUpdate({ new_mood, filler_analysis }) {
    set((s) => ({
      currentMood: new_mood,
      moodHistory: [
        ...s.moodHistory,
        { turnIndex: s.messages.length, mood: new_mood, fillerAnalysis: filler_analysis },
      ],
    }))
  },

  addAudioTurn({ userTranscript, response, currentMood, fillerAnalysis }) {
    set((s) => ({
      currentMood,
      messages: [
        ...s.messages,
        { role: 'user', content: userTranscript },
        { role: 'ai', content: response },
      ],
      moodHistory: [
        ...s.moodHistory,
        { turnIndex: s.messages.length + 1, mood: currentMood, fillerAnalysis },
      ],
    }))
  },

  finishAiStream() {
    const { streamingText, messages } = get()
    set({
      messages: [...messages, { role: 'ai', content: streamingText }],
      isStreaming: false,
      streamingText: '',
    })
  },

  terminateSession(reason, durationSec = null) {
    set({
      terminated: true,
      terminationReason: reason,
      isStreaming: false,
      streamingText: '',
      durationSec,
    })
  },

  setDuration(durationSec) {
    set({ durationSec })
  },

  reset() {
    set({
      sessionId: null,
      setup: null,
      messages: [],
      currentMood: 5,
      moodHistory: [],
      isStreaming: false,
      streamingText: '',
      terminated: false,
      terminationReason: null,
      durationSec: null,
    })
  },
}))

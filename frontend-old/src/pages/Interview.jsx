import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { streamChat, sendAudioTurn } from '../lib/api'
import { useSessionStore } from '../store/sessionStore'
import { moodColor } from '../lib/mood'
import PageShell from '../components/layout/PageShell'

/**
 * The confirmed 1-10 mood int is mapped to a color (see lib/mood.js) —
 * this IS the "ambient cue, not a labeled meter" the brief asks for.
 * The number itself is never shown to the user.
 */

function TypingDots() {
  return (
    <div className="flex gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export default function Interview() {
  const { sessionId: sessionIdParam } = useParams()
  const navigate = useNavigate()

  const {
    sessionId,
    setup,
    messages,
    currentMood,
    isStreaming,
    streamingText,
    terminated,
    addUserMessage,
    beginAiStream,
    appendAiToken,
    applyMoodUpdate,
    finishAiStream,
    terminateSession,
    addAudioTurn,
    setDuration,
  } = useSessionStore()

  const [input, setInput] = useState('')
  const [error, setError] = useState(null)
  const [openingRequested, setOpeningRequested] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(true)
  const scrollRef = useRef(null)

  // If the store's session doesn't match the URL (e.g. page refresh),
  // there's no setup data to resume from — send them back to start one.
  const sessionMismatch = !sessionId || sessionId !== sessionIdParam

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText])

  async function runTurn(userText) {
    setError(null)
    beginAiStream()
    try {
      await streamChat(
        { session_id: sessionId, message: userText },
        {
          onToken: appendAiToken,
          onMood: applyMoodUpdate,
          onTerminate: (reason) => {
            setDuration(elapsed)
            terminateSession(reason)
            navigate(`/report/${sessionId}?terminated=${encodeURIComponent(reason)}`)
          },
        }
      )
    } catch (err) {
      if (err.terminated) {
        setDuration(elapsed)
        terminateSession(err.reason)
        navigate(`/report/${sessionId}?terminated=${encodeURIComponent(err.reason)}`)
      } else {
        setError(err.message || 'Connection to the interviewer dropped — try again.')
      }
    } finally {
      if (!terminated) {
        const lastResponse = useSessionStore.getState().streamingText
        finishAiStream()
        speakText(lastResponse)
      }
    }
  }

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  function fmtTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0')
    const s = String(sec % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  // ASSUMPTION (unconfirmed): the interviewer's opening question is
  // fetched by sending an empty first message to /api/chat right after
  // /api/start. If the backend instead sends the opener as part of
  // /api/start's response, swap this for reading it off that response
  // in Setup.jsx instead.
  useEffect(() => {
    if (sessionMismatch || openingRequested || messages.length > 0) return
    setOpeningRequested(true)
    runTurn('Begin the interview')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMismatch, openingRequested, messages.length])

  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Helper function to get supported audio MIME type
  const getSupportedAudioMimeType = () => {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];

    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      return null;
    }

    // Try each MIME type until we find one that's supported
    for (const mimeType of mimeTypes) {
      try {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          return mimeType;
        }
      } catch (e) {
        // Some browsers throw errors on unsupported types
        continue;
      }
    }

    return null;
  };

  function speakText(text) {
    if (muted || !text) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.0
    const voices = window.speechSynthesis.getVoices()
    u.voice = voices.find(v => v.lang.startsWith('en-US'))
      || voices.find(v => v.lang.startsWith('en'))
    window.speechSynthesis.speak(u)
  }

  function stopSpeaking() { window.speechSynthesis.cancel() }

  async function startRecording() {
    stopSpeaking()
    try {
      // Check for MediaRecorder support
      if (!window.MediaRecorder) {
        setError('Audio recording is not supported in this browser.')
        return
      }

      // Get supported MIME type
      const mimeType = getSupportedAudioMimeType()
      if (!mimeType) {
        setError('No supported audio format found for recording.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const audioFile = new File([audioBlob], `audio_turn.${mimeType.includes('webm') ? 'webm' : 'ogg'}`, { type: mimeType })

        setError(null)
        beginAiStream()
        try {
          const res = await sendAudioTurn({ audioFile, sessionId })
          addAudioTurn({
            userTranscript: res.user_transcript,
            response: res.response,
            currentMood: res.current_mood,
            fillerAnalysis: res.current_turn_fillers,
          })
          speakText(res.response)
        } catch (err) {
          setError(err.message || 'Audio processing failed — try again.')
        } finally {
          finishAiStream()
          stream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      // Handle specific error types
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please grant permission to use your microphone.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.')
      } else {
        setError('Microphone access failed — please check your microphone settings and try again.')
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  function toggleRecording() {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  async function handleSend() {
    stopSpeaking()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    addUserMessage(text)
    await runTurn(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (sessionMismatch) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">No active session</h1>
          <p className="text-muted text-sm mb-6">
            This interview link isn't tied to a session in progress. Start a new one to continue.
          </p>
          <button
            onClick={() => navigate('/scenarios')}
            className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
          >
            Start a session
          </button>
        </div>
      </PageShell>
    )
  }

  const glow = moodColor(currentMood)

  return (
    <PageShell className="flex flex-col h-screen">
      {/* ambient mood bar — the only visible signal, no number/label */}
      <motion.div
        className="h-[3px] w-full shrink-0"
        animate={{ backgroundColor: glow, boxShadow: `0 0 20px ${glow}` }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            {setup?.scenario ?? 'Interview'}
          </p>
          <p className="text-sm text-muted mt-0.5">{setup?.context}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-dim tabular-nums">{fmtTime(elapsed)}</span>
          <button
            onClick={() => {
              setDuration(elapsed)
              navigate(`/report/${sessionId}`)
            }}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted hover:border-border-light hover:text-primary transition-colors"
          >
            End session
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-surface border border-border rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl rounded-bl-sm max-w-[80%]">
                {streamingText ? (
                  <p className="px-4 py-3 text-sm leading-relaxed">{streamingText}</p>
                ) : (
                  <TypingDots />
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-mood-cold text-center">{error}</p>}
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Type your answer…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm placeholder:text-dim focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isStreaming}
            className={`px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${
              recording
                ? 'bg-mood-cold/20 border-mood-cold text-mood-cold animate-pulse'
                : 'border-border bg-surface text-muted hover:border-border-light hover:text-primary'
            }`}
            title={recording ? 'Stop recording' : 'Record voice answer'}
          >
            🎤 {recording ? 'Stop' : 'Voice'}
          </button>
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            className="px-3 py-3 rounded-lg border border-border bg-surface text-sm hover:border-border-light transition-colors"
            title={muted ? 'Unmute voice' : 'Mute voice'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-5 py-3 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-light transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </PageShell>
  )
}

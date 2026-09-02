import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { streamChat, sendAudioTurn } from '../lib/api'
import { useSessionStore } from '../store/sessionStore'
import { moodColor } from '../lib/mood'

function TypingDots() {
  return (
    <div className="flex gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted"
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
        setError(err.message || 'Connection to the interviewer dropped.')
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

  useEffect(() => {
    if (sessionMismatch || openingRequested || messages.length > 0) return
    setOpeningRequested(true)
    runTurn('Begin the interview')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMismatch, openingRequested, messages.length])

  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const getSupportedAudioMimeType = () => {
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
    if (!window.MediaRecorder) return null
    for (const mimeType of mimeTypes) {
      try { if (MediaRecorder.isTypeSupported(mimeType)) return mimeType } catch { continue }
    }
    return null
  }

  function speakText(text) {
    if (muted || !text) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.0
    const voices = window.speechSynthesis.getVoices()
    u.voice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'))
    window.speechSynthesis.speak(u)
  }

  function stopSpeaking() { window.speechSynthesis.cancel() }

  async function startRecording() {
    stopSpeaking()
    try {
      if (!window.MediaRecorder) { setError('Audio recording not supported.'); return }
      const mimeType = getSupportedAudioMimeType()
      if (!mimeType) { setError('No supported audio format found.'); return }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const audioFile = new File([audioBlob], `audio.${mimeType.includes('webm') ? 'webm' : 'ogg'}`, { type: mimeType })
        setError(null)
        beginAiStream()
        try {
          const res = await sendAudioTurn({ audioFile, sessionId })
          addAudioTurn({ userTranscript: res.user_transcript, response: res.response, currentMood: res.current_mood, fillerAnalysis: res.current_turn_fillers })
          speakText(res.response)
        } catch (err) { setError(err.message || 'Audio processing failed.') }
        finally { finishAiStream(); stream.getTracks().forEach(t => t.stop()) }
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('Microphone access denied.')
      else if (err.name === 'NotFoundError') setError('No microphone found.')
      else setError('Microphone access failed.')
    }
  }

  function stopRecording() { if (mediaRecorderRef.current && recording) { mediaRecorderRef.current.stop(); setRecording(false) } }

  async function handleSend() {
    stopSpeaking()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    addUserMessage(text)
    await runTurn(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (sessionMismatch) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <h1 className="text-lg font-semibold mb-2">No active session</h1>
          <p className="text-muted text-sm mb-6">This interview link isn't tied to a session in progress.</p>
          <button onClick={() => navigate('/scenarios')} className="rounded-[var(--radius)] bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity">
            Start a session
          </button>
        </div>
      </div>
    )
  }

  const glow = moodColor(currentMood)

  return (
    <div className="flex h-full flex-col">
      {/* Ambient mood bar — flat, no shadow/glow */}
      <div
        className="h-[2px] w-full shrink-0 transition-colors duration-800"
        style={{ backgroundColor: glow }}
      />

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-[var(--radius)] px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-elevated text-foreground rounded-br-[calc(var(--radius)+2px)]'
                    : 'bg-surface text-secondary border border-border rounded-bl-[calc(var(--radius)+2px)]'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-[var(--radius)] rounded-bl-[calc(var(--radius)+2px)] border border-border bg-surface">
                {streamingText ? (
                  <p className="px-4 py-2.5 text-sm leading-relaxed text-secondary">{streamingText}</p>
                ) : (
                  <TypingDots />
                )}
              </div>
            </div>
          )}

          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {/* Voice toggle */}
          <button
            type="button"
            onClick={() => { if (recording) stopRecording(); else startRecording() }}
            disabled={isStreaming}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] border transition-colors ${
              recording
                ? 'border-destructive/40 bg-destructive/10 text-destructive animate-pulse'
                : 'border-border-light bg-surface text-muted hover:text-foreground'
            }`}
            title={recording ? 'Stop recording' : 'Record voice'}
          >
            <svg className="h-4 w-4" fill={recording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Type your response…"
            className="flex-1 rounded-[var(--radius)] border border-border-light bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent transition-colors disabled:opacity-40"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        {/* End session */}
        <div className="mx-auto mt-2 flex max-w-2xl justify-center">
          <button
            onClick={() => { setDuration(elapsed); navigate(`/report/${sessionId}`) }}
            className="text-[11px] text-dim hover:text-muted transition-colors"
          >
            end session
          </button>
        </div>
      </div>
    </div>
  )
}

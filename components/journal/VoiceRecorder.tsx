'use client'

import { useState, useRef } from 'react'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any

export function processTranscript(text: string): string {
  const punctuationMap: Record<string, string> = {
    ' period': '.', ' comma': ',', ' question mark': '?',
    ' exclamation point': '!', ' exclamation mark': '!',
    ' colon': ':', ' semicolon': ';', ' dash': ' —',
    ' new line': '\n', ' new paragraph': '\n\n',
  }

  let result = text
  for (const [spoken, symbol] of Object.entries(punctuationMap)) {
    result = result.replace(new RegExp(spoken, 'gi'), symbol)
  }

  // Capitalize after sentence-ending punctuation within the same fragment
  result = result.replace(/([.!?]\s+)([a-z])/g, (_, punct, letter) => punct + letter.toUpperCase())

  // Strip spaces immediately following a newline (artifact of word-boundary replacement)
  result = result.replace(/\n +/g, '\n')
  result = result.trim()
  result = result.charAt(0).toUpperCase() + result.slice(1)

  return result
}

export default function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false)
  const isListeningRef = useRef(false)
  const recognitionRef = useRef<AnyRecognition>(null)

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: { resultIndex: number; results: { isFinal: boolean; [0]: { transcript: string } }[] }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const processed = processTranscript(event.results[i][0].transcript)
          onTranscript(processed)
        }
      }
    }

    recognition.onend = () => {
      if (isListeningRef.current) {
        recognition.start()
      }
    }

    recognition.onerror = (event: { error: string }) => {
      if (['not-allowed', 'service-not-allowed', 'no-speech'].includes(event.error)) {
        isListeningRef.current = false
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition
    isListeningRef.current = true
    setIsListening(true)
    recognition.start()
  }

  function stopListening() {
    isListeningRef.current = false
    setIsListening(false)
    recognitionRef.current?.stop()
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-gray-400">Voice recording not supported in this browser. Use Chrome or Edge.</p>
    )
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        fontSize: '12px',
        fontWeight: '500',
        background: isListening ? '#2a0a0a' : '#1A1410',
        border: `0.5px solid ${isListening ? '#C8A19C' : '#91766E'}`,
        borderRadius: '8px',
        color: isListening ? '#C8A19C' : '#F3ECE3',
        cursor: 'pointer',
      }}
    >
      <span>{isListening ? '⏹' : '🎤'}</span>
      {isListening ? 'Stop recording' : 'Record voice'}
    </button>
  )
}

import { supabase } from './supabase'

// Use Web Speech API for client-side transcription (free, works offline)
export function transcribeWithWebSpeech(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported in this browser'))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalTranscript = ''

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }
    }

    recognition.onerror = (event: any) => {
      reject(new Error(`Speech recognition error: ${event.error}`))
    }

    recognition.onend = () => {
      resolve(finalTranscript.trim())
    }

    // Play audio and transcribe
    const audio = new Audio(URL.createObjectURL(audioBlob))
    
    audio.onplay = () => {
      recognition.start()
    }
    
    audio.onended = () => {
      recognition.stop()
    }
    
    audio.play().catch(reject)
  })
}

// Use OpenAI Whisper API for better accuracy (requires API key)
export async function transcribeWithWhisper(audioBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Transcription failed')
  }

  const data = await response.json()
  return data.text
}

// Save transcription to evaluation
export async function saveTranscription(
  evaluationId: string, 
  transcription: string
): Promise<void> {
  const { error } = await supabase
    .from('evaluations')
    .update({ 
      transcribed_notes: transcription,
      updated_at: new Date().toISOString()
    })
    .eq('id', evaluationId)

  if (error) {
    throw new Error(`Failed to save transcription: ${error.message}`)
  }
}

// Auto-transcribe all voice notes for an evaluation
export async function autoTranscribeVoiceNotes(
  evaluationId: string,
  voiceNoteUrls: string[],
  method: 'web-speech' | 'whisper' = 'web-speech'
): Promise<string> {
  const transcriptions: string[] = []

  for (const url of voiceNoteUrls) {
    try {
      // Fetch audio blob
      const response = await fetch(url)
      const blob = await response.blob()

      // Transcribe
      let text: string
      if (method === 'whisper') {
        text = await transcribeWithWhisper(blob)
      } else {
        text = await transcribeWithWebSpeech(blob)
      }

      transcriptions.push(text)
    } catch (error) {
      console.error('Failed to transcribe:', error)
      transcriptions.push('[Transcription failed]')
    }
  }

  const fullTranscription = transcriptions.join('\n\n')
  
  // Save to database
  await saveTranscription(evaluationId, fullTranscription)
  
  return fullTranscription
}

export default {
  transcribeWithWebSpeech,
  transcribeWithWhisper,
  saveTranscription,
  autoTranscribeVoiceNotes
}

/**
 * Whisper API utility for secure speech-to-text transcription
 * Uses server-side OpenAI API to keep API keys secure
 */

export interface TranscriptionResult {
  transcription: string;
  confidence: number;
  model: string;
  language: string;
}

export interface TranscriptionError {
  error: string;
  message?: string;
  fallback?: string;
}

/**
 * Convert audio blob to base64 for server transmission
 */
function audioToBase64(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data:audio/webm;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Falls back to browser speech recognition if API unavailable
 */
export async function transcribeWithWhisper(
  audioBlob: Blob,
  options: {
    language?: string;
    onFallback?: () => void;
  } = {}
): Promise<TranscriptionResult> {
  try {
    console.log('🎤 Starting Whisper transcription...');
    
    // Convert audio to base64
    const audioData = await audioToBase64(audioBlob);
    
    // Send to server for secure API processing
    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData,
        language: options.language || 'en'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Transcription failed');
    }
    
    console.log('✅ Whisper transcription successful');
    return data;
    
  } catch (error) {
    console.warn('❌ Whisper transcription failed:', error);
    
    // Call fallback handler if provided
    if (options.onFallback) {
      options.onFallback();
    }
    
    throw error;
  }
}

/**
 * Enhanced audio recorder with Whisper integration
 */
export class WhisperRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  
  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 // Optimal for Whisper
        } 
      });
      
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      
      console.log('🎤 Recording started');
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw new Error('Microphone access denied or not available');
    }
  }
  
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not currently recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        console.log('🎤 Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }
  
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
  
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}
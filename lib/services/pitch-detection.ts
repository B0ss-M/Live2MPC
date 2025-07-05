// JavaScript implementation of pitch detection functionality
// Based on the provided Python pitch detection code

export interface PitchInfo {
  frequency: number
  midiNote: number
  note: string
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export async function detectPitch(audioBuffer: AudioBuffer): Promise<PitchInfo | null> {
  // Get audio data from buffer
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Use a small portion of the audio for analysis
  const analysisLength = Math.min(2048, data.length)
  const audioData = data.slice(0, analysisLength)

  // Apply Hamming window
  const windowed = applyWindow(audioData)

  // Perform FFT
  const fftResult = performFFT(windowed)

  // Find peak frequency
  const { peakFreq } = findPeakFrequency(fftResult, sampleRate, analysisLength)

  if (peakFreq <= 0) {
    return null
  }

  // Convert frequency to MIDI note number
  const midiNote = 69 + 12 * Math.log2(peakFreq / 440.0)
  const midiNoteInt = Math.round(midiNote)
  const noteName = NOTE_NAMES[midiNoteInt % 12]
  const octave = Math.floor(midiNoteInt / 12) - 1

  return {
    frequency: peakFreq,
    midiNote: midiNoteInt,
    note: `${noteName}${octave}`,
  }
}

function applyWindow(data: Float32Array): Float32Array {
  const result = new Float32Array(data.length)

  // Apply Hamming window
  for (let i = 0; i < data.length; i++) {
    const windowValue = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (data.length - 1))
    result[i] = data[i] * windowValue
  }

  return result
}

function performFFT(data: Float32Array): Float32Array {
  // This is a simplified FFT implementation
  // In a real application, you would use a library like DSP.js

  // For now, we'll use the Web Audio API's AnalyserNode for FFT
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = data.length * 2

  const bufferSource = audioContext.createBufferSource()
  const buffer = audioContext.createBuffer(1, data.length, audioContext.sampleRate)
  buffer.getChannelData(0).set(data)
  bufferSource.buffer = buffer

  bufferSource.connect(analyser)

  const fftResult = new Float32Array(analyser.frequencyBinCount)
  analyser.getFloatFrequencyData(fftResult)

  return fftResult
}

function findPeakFrequency(
  fftResult: Float32Array,
  sampleRate: number,
  dataLength: number,
): { peakFreq: number; magnitude: number } {
  let maxMagnitude = Number.NEGATIVE_INFINITY
  let peakIndex = 0

  // Find the peak in the FFT result
  for (let i = 0; i < fftResult.length; i++) {
    if (fftResult[i] > maxMagnitude) {
      maxMagnitude = fftResult[i]
      peakIndex = i
    }
  }

  // Convert index to frequency
  const peakFreq = (peakIndex * sampleRate) / dataLength

  return { peakFreq, magnitude: maxMagnitude }
}

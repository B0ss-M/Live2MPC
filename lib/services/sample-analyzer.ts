import type { Sample } from "../sample-manager"
import AudioContextManager from "../audio-context"

export interface SampleAnalysis {
  id: string
  name: string
  channels: number
  sampleWidth: number
  sampleRate: number
  duration: number
  peakAmplitude: number
  rmsAmplitude: number
  crestFactor: number
  zeroCrossings: number
  estimatedPitch?: {
    frequency: number
    note: string
    midiNote: number
  }
  format: string
  valid: boolean
  error?: string
}

export interface WaveformStats {
  min: number
  max: number
  peak: number
  rms: number
  crestFactor: number
  zeroCrossings: number
}

export class SampleAnalyzer {
  private audioContext: AudioContextManager

  constructor() {
    this.audioContext = AudioContextManager.getInstance()
  }

  /**
   * Analyzes an audio sample to extract its properties
   */
  public analyzeSample(sample: Sample): SampleAnalysis {
    if (!sample.buffer) {
      return {
        id: sample.id,
        name: sample.name,
        channels: 0,
        sampleWidth: 0,
        sampleRate: 0,
        duration: 0,
        peakAmplitude: 0,
        rmsAmplitude: 0,
        crestFactor: 0,
        zeroCrossings: 0,
        format: this.detectFormatFromFilename(sample.name),
        valid: false,
        error: "No audio buffer available",
      }
    }

    try {
      // Analyze waveform statistics
      const stats = this.analyzeWaveform(sample.buffer)

      // Detect format from filename
      const format = this.detectFormatFromFilename(sample.name)

      // Try to estimate pitch
      const estimatedPitch = this.estimatePitch(sample.buffer)

      return {
        id: sample.id,
        name: sample.name,
        channels: sample.buffer.numberOfChannels,
        sampleWidth: 16, // Web Audio API typically uses 32-bit float, but we'll report 16-bit for compatibility
        sampleRate: sample.buffer.sampleRate,
        duration: sample.buffer.duration,
        peakAmplitude: stats.peak,
        rmsAmplitude: stats.rms,
        crestFactor: stats.crestFactor,
        zeroCrossings: stats.zeroCrossings,
        estimatedPitch: estimatedPitch,
        format,
        valid: true,
      }
    } catch (error) {
      return {
        id: sample.id,
        name: sample.name,
        channels: 0,
        sampleWidth: 0,
        sampleRate: 0,
        duration: 0,
        peakAmplitude: 0,
        rmsAmplitude: 0,
        crestFactor: 0,
        zeroCrossings: 0,
        format: this.detectFormatFromFilename(sample.name),
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Analyzes multiple samples and returns their properties
   */
  public analyzeSamples(samples: Sample[]): SampleAnalysis[] {
    return samples.map((sample) => this.analyzeSample(sample))
  }

  /**
   * Finds samples that match a specific note (e.g., C3)
   */
  public findSamplesByNote(samples: Sample[], noteName: string): Sample[] {
    const upperNoteName = noteName.toUpperCase()
    return samples.filter((sample) => sample.name.toUpperCase().includes(upperNoteName))
  }

  /**
   * Extracts a C3 sample from a collection of samples
   */
  public extractC3Sample(samples: Sample[]): Sample | null {
    const c3Samples = this.findSamplesByNote(samples, "C3")
    return c3Samples.length > 0 ? c3Samples[0] : null
  }

  /**
   * Validates samples against common requirements
   */
  public validateSamples(samples: Sample[]): { valid: Sample[]; invalid: Sample[]; issues: Map<string, string[]> } {
    const valid: Sample[] = []
    const invalid: Sample[] = []
    const issues = new Map<string, string[]>()

    samples.forEach((sample) => {
      const sampleIssues: string[] = []

      // Check if sample has a buffer
      if (!sample.buffer) {
        sampleIssues.push("No audio data")
        invalid.push(sample)
        issues.set(sample.id, sampleIssues)
        return
      }

      // Check sample rate (44.1kHz or 48kHz are common)
      if (sample.buffer.sampleRate !== 44100 && sample.buffer.sampleRate !== 48000) {
        sampleIssues.push(`Unusual sample rate: ${sample.buffer.sampleRate}Hz`)
      }

      // Check number of channels (mono or stereo)
      if (sample.buffer.numberOfChannels > 2) {
        sampleIssues.push(`Unusual channel count: ${sample.buffer.numberOfChannels}`)
      }

      // Check duration (warn if very short or very long)
      if (sample.duration < 0.05) {
        sampleIssues.push("Sample is extremely short (<50ms)")
      } else if (sample.duration > 10) {
        sampleIssues.push("Sample is very long (>10s)")
      }

      // Check for DC offset
      const stats = this.analyzeWaveform(sample.buffer)
      if (Math.abs(stats.min + stats.max) > 0.1) {
        sampleIssues.push("Sample may have DC offset")
      }

      // Check for clipping
      if (stats.peak > 0.99) {
        sampleIssues.push("Sample may be clipping")
      }

      // Check for very low level
      if (stats.peak < 0.1) {
        sampleIssues.push("Sample has very low level")
      }

      if (sampleIssues.length > 0) {
        issues.set(sample.id, sampleIssues)
        invalid.push(sample)
      } else {
        valid.push(sample)
      }
    })

    return { valid, invalid, issues }
  }

  /**
   * Analyzes waveform statistics
   */
  private analyzeWaveform(buffer: AudioBuffer): WaveformStats {
    // Use the first channel for analysis
    const data = buffer.getChannelData(0)

    let min = 0
    let max = 0
    let sum = 0
    let sumSquares = 0
    let zeroCrossings = 0
    let prevSample = 0

    // Analyze the waveform
    for (let i = 0; i < data.length; i++) {
      const sample = data[i]

      // Track min/max
      if (sample < min) min = sample
      if (sample > max) max = sample

      // Sum for RMS calculation
      sum += sample
      sumSquares += sample * sample

      // Count zero crossings
      if ((prevSample < 0 && sample >= 0) || (prevSample >= 0 && sample < 0)) {
        zeroCrossings++
      }

      prevSample = sample
    }

    // Calculate statistics
    const mean = sum / data.length
    const rms = Math.sqrt(sumSquares / data.length)
    const peak = Math.max(Math.abs(min), Math.abs(max))
    const crestFactor = peak > 0 ? peak / rms : 0

    return {
      min,
      max,
      peak,
      rms,
      crestFactor,
      zeroCrossings,
    }
  }

  /**
   * Estimates the fundamental pitch of a sample
   */
  private estimatePitch(buffer: AudioBuffer): { frequency: number; note: string; midiNote: number } | undefined {
    try {
      // Simple pitch estimation using zero-crossing rate
      const data = buffer.getChannelData(0)
      const zeroCrossings = this.countZeroCrossings(data)

      // Estimate frequency from zero crossings
      // This is a very basic method and not very accurate
      const estimatedFrequency = (zeroCrossings / 2) * (buffer.sampleRate / data.length)

      // Convert frequency to MIDI note and note name
      const midiNote = this.frequencyToMidi(estimatedFrequency)
      const noteName = this.midiToNoteName(midiNote)

      return {
        frequency: estimatedFrequency,
        note: noteName,
        midiNote,
      }
    } catch (error) {
      console.error("Error estimating pitch:", error)
      return undefined
    }
  }

  /**
   * Counts zero crossings in audio data
   */
  private countZeroCrossings(data: Float32Array): number {
    let zeroCrossings = 0
    let prevSample = 0

    for (let i = 0; i < data.length; i++) {
      if ((prevSample < 0 && data[i] >= 0) || (prevSample >= 0 && data[i] < 0)) {
        zeroCrossings++
      }
      prevSample = data[i]
    }

    return zeroCrossings
  }

  /**
   * Converts frequency to MIDI note number
   */
  private frequencyToMidi(frequency: number): number {
    return Math.round(69 + 12 * Math.log2(frequency / 440))
  }

  /**
   * Converts MIDI note number to note name
   */
  private midiToNoteName(midiNote: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Math.floor(midiNote / 12) - 1
    const noteName = noteNames[midiNote % 12]
    return `${noteName}${octave}`
  }

  /**
   * Detects audio format from filename
   */
  private detectFormatFromFilename(filename: string): string {
    const extension = this.getFileExtension(filename).toLowerCase()

    switch (extension) {
      case ".wav":
        return "WAV"
      case ".mp3":
        return "MP3"
      case ".aiff":
      case ".aif":
        return "AIFF"
      case ".ogg":
        return "OGG"
      case ".flac":
        return "FLAC"
      default:
        return "Unknown"
    }
  }

  /**
   * Gets file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split(".")
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : ""
  }
}

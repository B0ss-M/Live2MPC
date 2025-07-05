import AudioContextManager from "../audio-context"
import SampleManager, { type Sample } from "../sample-manager"

export interface EditedSample {
  id: string
  buffer: AudioBuffer
  waveform: number[]
}

export class SampleEditor {
  private audioContext: AudioContextManager
  private sampleManager: SampleManager
  private sample: Sample
  private audioBuffer: AudioBuffer | null

  constructor(sampleId: string) {
    this.audioContext = AudioContextManager.getInstance()
    this.sampleManager = SampleManager.getInstance()

    const sample = this.sampleManager.getSample(sampleId)
    if (!sample) {
      throw new Error(`Sample with ID ${sampleId} not found`)
    }

    this.sample = sample
    this.audioBuffer = sample.buffer
  }

  public async normalize(): Promise<void> {
    if (!this.audioBuffer) return

    const context = this.audioContext.getContext()
    if (!context) return

    // Create a new buffer for the normalized audio
    const normalizedBuffer = context.createBuffer(
      this.audioBuffer.numberOfChannels,
      this.audioBuffer.length,
      this.audioBuffer.sampleRate,
    )

    // Process each channel
    for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
      const inputData = this.audioBuffer.getChannelData(channel)
      const outputData = normalizedBuffer.getChannelData(channel)

      // Find the maximum amplitude
      let maxAmplitude = 0
      for (let i = 0; i < inputData.length; i++) {
        const absValue = Math.abs(inputData[i])
        if (absValue > maxAmplitude) {
          maxAmplitude = absValue
        }
      }

      // Apply normalization
      const gain = maxAmplitude > 0 ? 1.0 / maxAmplitude : 1.0
      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] * gain
      }
    }

    this.audioBuffer = normalizedBuffer
  }

  public async trimSilence(silenceThreshold = 0.01, marginSamples = 100): Promise<void> {
    if (!this.audioBuffer) return

    const context = this.audioContext.getContext()
    if (!context) return

    // Find start and end points (non-silent)
    let startSample = 0
    let endSample = this.audioBuffer.length - 1

    // Process first channel for simplicity
    const audioData = this.audioBuffer.getChannelData(0)

    // Find start point
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > silenceThreshold) {
        startSample = Math.max(0, i - marginSamples)
        break
      }
    }

    // Find end point
    for (let i = audioData.length - 1; i >= 0; i--) {
      if (Math.abs(audioData[i]) > silenceThreshold) {
        endSample = Math.min(audioData.length - 1, i + marginSamples)
        break
      }
    }

    // Create a new buffer with the trimmed audio
    const trimmedLength = endSample - startSample + 1
    const trimmedBuffer = context.createBuffer(
      this.audioBuffer.numberOfChannels,
      trimmedLength,
      this.audioBuffer.sampleRate,
    )

    // Copy the trimmed portion to the new buffer
    for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
      const inputData = this.audioBuffer.getChannelData(channel)
      const outputData = trimmedBuffer.getChannelData(channel)

      for (let i = 0; i < trimmedLength; i++) {
        outputData[i] = inputData[i + startSample]
      }
    }

    this.audioBuffer = trimmedBuffer
  }

  public async fade(fadeInMs = 10, fadeOutMs = 10): Promise<void> {
    if (!this.audioBuffer) return

    const context = this.audioContext.getContext()
    if (!context) return

    // Create a new buffer for the faded audio
    const fadedBuffer = context.createBuffer(
      this.audioBuffer.numberOfChannels,
      this.audioBuffer.length,
      this.audioBuffer.sampleRate,
    )

    // Calculate fade samples
    const fadeInSamples = Math.floor((fadeInMs * this.audioBuffer.sampleRate) / 1000)
    const fadeOutSamples = Math.floor((fadeOutMs * this.audioBuffer.sampleRate) / 1000)

    // Process each channel
    for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
      const inputData = this.audioBuffer.getChannelData(channel)
      const outputData = fadedBuffer.getChannelData(channel)

      // Apply fade in
      for (let i = 0; i < fadeInSamples; i++) {
        const gain = i / fadeInSamples
        outputData[i] = inputData[i] * gain
      }

      // Copy the middle part unchanged
      for (let i = fadeInSamples; i < this.audioBuffer.length - fadeOutSamples; i++) {
        outputData[i] = inputData[i]
      }

      // Apply fade out
      for (let i = 0; i < fadeOutSamples; i++) {
        const position = this.audioBuffer.length - fadeOutSamples + i
        const gain = 1 - i / fadeOutSamples
        outputData[position] = inputData[position] * gain
      }
    }

    this.audioBuffer = fadedBuffer
  }

  public async detectLoopPoints(): Promise<{ start: number; end: number } | null> {
    if (!this.audioBuffer) return null

    // This is a simplified implementation of loop point detection
    // In a real implementation, we would use more sophisticated algorithms

    const audioData = this.audioBuffer.getChannelData(0)
    const frameMargin = Math.floor(this.audioBuffer.sampleRate * 0.1) // 100ms margin

    // Find peaks in the audio data
    const peaks: number[] = []
    const threshold = 0.5
    let maxAmplitude = 0

    // Find max amplitude
    for (let i = 0; i < audioData.length; i++) {
      const absValue = Math.abs(audioData[i])
      if (absValue > maxAmplitude) {
        maxAmplitude = absValue
      }
    }

    // Find peaks
    for (let i = 1; i < audioData.length - 1; i++) {
      if (
        Math.abs(audioData[i]) > threshold * maxAmplitude &&
        Math.abs(audioData[i]) > Math.abs(audioData[i - 1]) &&
        Math.abs(audioData[i]) > Math.abs(audioData[i + 1])
      ) {
        peaks.push(i)
      }
    }

    if (peaks.length < 2) return null

    const start = peaks[0] + frameMargin
    const end = peaks[peaks.length - 1] - frameMargin

    if (start >= end) return null

    return { start, end }
  }

  public async save(): Promise<Sample> {
    if (!this.audioBuffer) {
      throw new Error("No audio buffer to save")
    }

    // Generate waveform data
    const waveform = this.generateWaveformData(this.audioBuffer)

    // Update the sample in the sample manager
    const updatedSample: Sample = {
      ...this.sample,
      buffer: this.audioBuffer,
      waveform,
      duration: this.audioBuffer.duration,
      isLoaded: true,
    }

    this.sampleManager.updateSample(updatedSample)

    return updatedSample
  }

  private generateWaveformData(buffer: AudioBuffer, points = 100): number[] {
    const channelData = buffer.getChannelData(0) // Use first channel
    const blockSize = Math.floor(channelData.length / points)
    const waveform: number[] = []

    for (let i = 0; i < points; i++) {
      const start = i * blockSize
      let max = 0

      // Find max amplitude in this block
      for (let j = 0; j < blockSize; j++) {
        const amplitude = Math.abs(channelData[start + j])
        if (amplitude > max) max = amplitude
      }

      waveform.push(max)
    }

    // Normalize to 0-1 range
    const maxValue = Math.max(...waveform, 0.01)
    return waveform.map((val) => val / maxValue)
  }
}

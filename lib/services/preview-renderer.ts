import AudioContextManager from "../audio-context"
import SampleManager from "../sample-manager"

export class PreviewRenderer {
  private audioContext: AudioContextManager
  private sampleManager: SampleManager

  constructor() {
    this.audioContext = AudioContextManager.getInstance()
    this.sampleManager = SampleManager.getInstance()
  }

  public async renderDrumkitPreview(sampleIds: string[]): Promise<AudioBuffer | null> {
    const context = this.audioContext.getContext()
    if (!context) return null

    // Create a silent buffer for the preview
    const previewDuration = 4 // 4 seconds
    const previewBuffer = context.createBuffer(
      2, // stereo
      context.sampleRate * previewDuration,
      context.sampleRate,
    )

    if (sampleIds.length === 0) return previewBuffer

    // Calculate interval between samples
    const interval = previewDuration / Math.min(8, sampleIds.length)
    let offset = 0

    // Mix samples into the preview
    for (let i = 0; i < Math.min(8, sampleIds.length); i++) {
      const sample = this.sampleManager.getSample(sampleIds[i])
      if (!sample || !sample.buffer) continue

      // Create a trimmed version of the sample (max 800ms)
      const maxDuration = 0.8 // 800ms
      const sampleDuration = Math.min(maxDuration, sample.buffer.duration)
      const trimmedBuffer = this.trimBuffer(sample.buffer, sampleDuration)

      // Apply fade out
      const fadedBuffer = this.applyFadeOut(trimmedBuffer, 0.2) // 200ms fade out

      // Mix the sample into the preview buffer
      this.mixBuffers(fadedBuffer, previewBuffer, offset)
      offset += interval * context.sampleRate
    }

    return previewBuffer
  }

  public async renderKeygroupPreview(sampleIds: string[]): Promise<AudioBuffer | null> {
    const context = this.audioContext.getContext()
    if (!context) return null

    // Create a silent buffer for the preview
    const previewDuration = 4 // 4 seconds
    const previewBuffer = context.createBuffer(
      2, // stereo
      context.sampleRate * previewDuration,
      context.sampleRate,
    )

    if (sampleIds.length === 0) return previewBuffer

    // Find C3 samples first (preferred for keygroup previews)
    const c3Samples = sampleIds.filter((id) => {
      const sample = this.sampleManager.getSample(id)
      return sample && sample.name.toUpperCase().includes("C3")
    })

    // Use C3 samples if available, otherwise use all samples
    const samplesToUse = c3Samples.length > 0 ? c3Samples : sampleIds

    // Calculate interval between samples
    const interval = previewDuration / Math.min(8, samplesToUse.length)
    let offset = 0

    // Mix samples into the preview
    for (let i = 0; i < Math.min(8, samplesToUse.length); i++) {
      const sample = this.sampleManager.getSample(samplesToUse[i])
      if (!sample || !sample.buffer) continue

      // Mix the sample into the preview buffer
      this.mixBuffers(sample.buffer, previewBuffer, offset)
      offset += interval * context.sampleRate
    }

    return previewBuffer
  }

  public async renderMidiPreview(sampleIds: string[], midiNotes: number[]): Promise<AudioBuffer | null> {
    const context = this.audioContext.getContext()
    if (!context) return null

    // Create a silent buffer for the preview
    const previewDuration = 4 // 4 seconds
    const previewBuffer = context.createBuffer(
      2, // stereo
      context.sampleRate * previewDuration,
      context.sampleRate,
    )

    if (sampleIds.length === 0 || midiNotes.length === 0) return previewBuffer

    // Map samples to MIDI notes
    const sampleMap = new Map<number, string>()

    // Simple mapping: distribute samples across the MIDI notes
    for (let i = 0; i < Math.min(sampleIds.length, midiNotes.length); i++) {
      sampleMap.set(midiNotes[i], sampleIds[i])
    }

    // Calculate interval between notes
    const interval = previewDuration / midiNotes.length
    let offset = 0

    // Mix samples according to MIDI notes
    for (const note of midiNotes) {
      const sampleId = sampleMap.get(note)
      if (!sampleId) continue

      const sample = this.sampleManager.getSample(sampleId)
      if (!sample || !sample.buffer) continue

      // Mix the sample into the preview buffer
      this.mixBuffers(sample.buffer, previewBuffer, offset)
      offset += interval * context.sampleRate
    }

    return previewBuffer
  }

  private trimBuffer(buffer: AudioBuffer, maxDuration: number): AudioBuffer {
    const context = this.audioContext.getContext()
    if (!context) return buffer

    const maxSamples = Math.floor(maxDuration * buffer.sampleRate)
    const trimmedLength = Math.min(buffer.length, maxSamples)

    const trimmedBuffer = context.createBuffer(buffer.numberOfChannels, trimmedLength, buffer.sampleRate)

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel)
      const outputData = trimmedBuffer.getChannelData(channel)

      for (let i = 0; i < trimmedLength; i++) {
        outputData[i] = inputData[i]
      }
    }

    return trimmedBuffer
  }

  private applyFadeOut(buffer: AudioBuffer, fadeDuration: number): AudioBuffer {
    const context = this.audioContext.getContext()
    if (!context) return buffer

    const fadeSamples = Math.floor(fadeDuration * buffer.sampleRate)

    if (fadeSamples >= buffer.length) {
      // If fade is longer than buffer, apply linear fade to entire buffer
      const fadedBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)
        const outputData = fadedBuffer.getChannelData(channel)

        for (let i = 0; i < buffer.length; i++) {
          const gain = 1 - i / buffer.length
          outputData[i] = inputData[i] * gain
        }
      }

      return fadedBuffer
    }

    // Apply fade to the end portion only
    const fadedBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel)
      const outputData = fadedBuffer.getChannelData(channel)

      // Copy the beginning unchanged
      for (let i = 0; i < buffer.length - fadeSamples; i++) {
        outputData[i] = inputData[i]
      }

      // Apply fade out to the end
      for (let i = 0; i < fadeSamples; i++) {
        const position = buffer.length - fadeSamples + i
        const gain = 1 - i / fadeSamples
        outputData[position] = inputData[position] * gain
      }
    }

    return fadedBuffer
  }

  private mixBuffers(source: AudioBuffer, destination: AudioBuffer, offsetFrames: number): void {
    // Mix source into destination at the specified offset
    const leftSource = source.getChannelData(0)
    const leftDest = destination.getChannelData(0)

    // Handle right channel if available
    const rightSource = source.numberOfChannels > 1 ? source.getChannelData(1) : leftSource
    const rightDest = destination.numberOfChannels > 1 ? destination.getChannelData(1) : leftDest

    const length = Math.min(leftSource.length, leftDest.length - offsetFrames)

    for (let i = 0; i < length; i++) {
      leftDest[i + offsetFrames] += leftSource[i]
      rightDest[i + offsetFrames] += rightSource[i]
    }
  }
}

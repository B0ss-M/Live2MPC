import AudioContextManager from "./audio-context"

export interface Sample {
  id: string
  name: string
  buffer: AudioBuffer | null
  waveform: number[] // Normalized waveform data (0-1)
  duration: number
  isLoaded: boolean
}

export interface PadAssignment {
  padId: number
  sampleId: string | null
  color?: string
}

class SampleManager {
  private static instance: SampleManager
  private samples: Map<string, Sample> = new Map()
  private padAssignments: PadAssignment[] = Array(16)
    .fill(null)
    .map((_, i) => ({
      padId: i,
      sampleId: null,
      color: this.getRandomPadColor(),
    }))
  private audioContext: AudioContextManager

  private constructor() {
    this.audioContext = AudioContextManager.getInstance()
  }

  public static getInstance(): SampleManager {
    if (!SampleManager.instance) {
      SampleManager.instance = new SampleManager()
    }
    return SampleManager.instance
  }

  private getRandomPadColor(): string {
    const colors = [
      "from-orange-500 to-red-500",
      "from-blue-500 to-purple-500",
      "from-green-500 to-teal-500",
      "from-yellow-500 to-amber-500",
      "from-pink-500 to-rose-500",
      "from-indigo-500 to-blue-500",
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  public async loadSample(file: File): Promise<Sample> {
    const id = `sample_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const name = file.name

    // Create a placeholder sample
    const sample: Sample = {
      id,
      name,
      buffer: null,
      waveform: [],
      duration: 0,
      isLoaded: false,
    }

    this.samples.set(id, sample)

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Load into audio context
      const buffer = await this.audioContext.loadSample(id, arrayBuffer)

      if (buffer) {
        // Generate waveform data
        const waveform = this.generateWaveformData(buffer)

        // Update sample with loaded data
        const updatedSample: Sample = {
          ...sample,
          buffer,
          waveform,
          duration: buffer.duration,
          isLoaded: true,
        }

        this.samples.set(id, updatedSample)
        return updatedSample
      }

      return sample
    } catch (error) {
      console.error("Failed to load sample:", error)
      return sample
    }
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

  public getSample(id: string): Sample | undefined {
    return this.samples.get(id)
  }

  public getAllSamples(): Sample[] {
    return Array.from(this.samples.values())
  }

  public updateSample(sample: Sample): void {
    this.samples.set(sample.id, sample)
  }

  public deleteSample(id: string): boolean {
    // Remove sample from pad assignments
    this.padAssignments.forEach((assignment) => {
      if (assignment.sampleId === id) {
        assignment.sampleId = null
      }
    })

    // Delete the sample
    return this.samples.delete(id)
  }

  public playSample(id: string, options: { volume?: number; pitch?: number } = {}): void {
    this.audioContext.playSample(id, options)
  }

  public stopSample(id: string): void {
    this.audioContext.stopSample(id)
  }

  public assignSampleToPad(padId: number, sampleId: string | null): void {
    const assignment = this.padAssignments.find((a) => a.padId === padId)
    if (assignment) {
      assignment.sampleId = sampleId
    }
  }

  public getPadAssignments(): PadAssignment[] {
    return [...this.padAssignments]
  }

  public getPadAssignment(padId: number): PadAssignment | undefined {
    return this.padAssignments.find((a) => a.padId === padId)
  }

  public getSampleForPad(padId: number): Sample | undefined {
    const assignment = this.getPadAssignment(padId)
    if (assignment && assignment.sampleId) {
      return this.getSample(assignment.sampleId)
    }
    return undefined
  }

  public playPad(padId: number): void {
    const sample = this.getSampleForPad(padId)
    if (sample && sample.id) {
      this.playSample(sample.id)
    }
  }
}

export default SampleManager

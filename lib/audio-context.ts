// Singleton to manage the Web Audio API context
class AudioContextManager {
  private static instance: AudioContextManager
  private context: AudioContext | null = null
  private samples: Map<string, AudioBuffer> = new Map()
  private activeSources: Map<string, AudioBufferSourceNode> = new Map()
  private masterGainNode: GainNode | null = null

  private constructor() {
    // Initialize on first use
    this.initContext()
  }

  public static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager()
    }
    return AudioContextManager.instance
  }

  private initContext() {
    try {
      // Create audio context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create master gain node
      if (this.context) {
        this.masterGainNode = this.context.createGain()
        this.masterGainNode.gain.value = 0.8 // Default volume
        this.masterGainNode.connect(this.context.destination)
      }

      console.log("Audio context initialized")
    } catch (error) {
      console.error("Failed to initialize audio context:", error)
    }
  }

  public getContext(): AudioContext | null {
    // Resume context if it was suspended (browsers require user interaction)
    if (this.context?.state === "suspended") {
      this.context.resume()
    }
    return this.context
  }

  public getMasterGain(): GainNode | null {
    return this.masterGainNode
  }

  public setMasterVolume(value: number): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  public async loadSample(id: string, audioData: ArrayBuffer): Promise<AudioBuffer | null> {
    if (!this.context) return null

    try {
      const buffer = await this.context.decodeAudioData(audioData)
      this.samples.set(id, buffer)
      return buffer
    } catch (error) {
      console.error("Failed to decode audio data:", error)
      return null
    }
  }

  public getSample(id: string): AudioBuffer | undefined {
    return this.samples.get(id)
  }

  public playSample(id: string, options: { volume?: number; pitch?: number } = {}): void {
    if (!this.context || !this.masterGainNode) return

    const buffer = this.samples.get(id)
    if (!buffer) {
      console.warn(`Sample with id ${id} not found`)
      return
    }

    // Stop any currently playing instance of this sample
    this.stopSample(id)

    // Create source node
    const source = this.context.createBufferSource()
    source.buffer = buffer

    // Apply pitch adjustment if provided
    if (options.pitch) {
      source.detune.value = (options.pitch - 1) * 1200 // Convert to cents
    }

    // Create gain node for this sample
    const gainNode = this.context.createGain()
    gainNode.gain.value = options.volume ?? 1

    // Connect nodes
    source.connect(gainNode)
    gainNode.connect(this.masterGainNode)

    // Start playback
    source.start(0)

    // Store reference to stop later
    this.activeSources.set(id, source)

    // Remove reference when playback ends
    source.onended = () => {
      this.activeSources.delete(id)
    }
  }

  public stopSample(id: string): void {
    const source = this.activeSources.get(id)
    if (source) {
      try {
        source.stop()
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.activeSources.delete(id)
    }
  }

  public stopAllSamples(): void {
    this.activeSources.forEach((source, id) => {
      this.stopSample(id)
    })
  }
}

export default AudioContextManager

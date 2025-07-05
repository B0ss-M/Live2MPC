import SampleManager from "./sample-manager"
import AudioContextManager from "./audio-context"

export interface SequencerStep {
  active: boolean
  velocity: number
}

export interface SequencerTrack {
  id: string
  padId: number
  steps: SequencerStep[]
}

export interface SequencerPattern {
  id: string
  name: string
  tracks: SequencerTrack[]
  stepsPerBar: number
  barsPerPattern: number
  swing: number
}

class Sequencer {
  private static instance: Sequencer
  private sampleManager: SampleManager
  private audioContext: AudioContextManager

  private patterns: Map<string, SequencerPattern> = new Map()
  private currentPatternId: string | null = null

  private isPlaying = false
  private currentStep = 0
  private tempo = 120
  private intervalId: number | null = null

  private constructor() {
    this.sampleManager = SampleManager.getInstance()
    this.audioContext = AudioContextManager.getInstance()

    // Create a default pattern
    this.createNewPattern()
  }

  public static getInstance(): Sequencer {
    if (!Sequencer.instance) {
      Sequencer.instance = new Sequencer()
    }
    return Sequencer.instance
  }

  public createNewPattern(options: Partial<SequencerPattern> = {}): string {
    const id = `pattern_${Date.now()}`
    const stepsPerBar = options.stepsPerBar || 16
    const barsPerPattern = options.barsPerPattern || 1
    const totalSteps = stepsPerBar * barsPerPattern

    // Create tracks for all 16 pads
    const tracks: SequencerTrack[] = []
    for (let i = 0; i < 16; i++) {
      const steps: SequencerStep[] = []
      for (let j = 0; j < totalSteps; j++) {
        steps.push({ active: false, velocity: 0.8 })
      }

      tracks.push({
        id: `track_${i}`,
        padId: i,
        steps,
      })
    }

    const pattern: SequencerPattern = {
      id,
      name: options.name || `Pattern ${this.patterns.size + 1}`,
      tracks,
      stepsPerBar,
      barsPerPattern,
      swing: options.swing || 0,
    }

    this.patterns.set(id, pattern)

    // Set as current if it's the first pattern
    if (!this.currentPatternId) {
      this.currentPatternId = id
    }

    return id
  }

  public getCurrentPattern(): SequencerPattern | null {
    if (!this.currentPatternId) return null
    return this.patterns.get(this.currentPatternId) || null
  }

  public setCurrentPattern(id: string): boolean {
    if (this.patterns.has(id)) {
      this.currentPatternId = id
      return true
    }
    return false
  }

  public getAllPatterns(): SequencerPattern[] {
    return Array.from(this.patterns.values())
  }

  public toggleStep(trackId: string, stepIndex: number): void {
    const pattern = this.getCurrentPattern()
    if (!pattern) return

    const track = pattern.tracks.find((t) => t.id === trackId)
    if (track && track.steps[stepIndex]) {
      track.steps[stepIndex].active = !track.steps[stepIndex].active
    }
  }

  public setStepVelocity(trackId: string, stepIndex: number, velocity: number): void {
    const pattern = this.getCurrentPattern()
    if (!pattern) return

    const track = pattern.tracks.find((t) => t.id === trackId)
    if (track && track.steps[stepIndex]) {
      track.steps[stepIndex].velocity = Math.max(0, Math.min(1, velocity))
    }
  }

  public setTempo(bpm: number): void {
    this.tempo = Math.max(30, Math.min(300, bpm))

    // Update timing if playing
    if (this.isPlaying) {
      this.stop()
      this.play()
    }
  }

  public getTempo(): number {
    return this.tempo
  }

  public play(): void {
    if (this.isPlaying) return

    const pattern = this.getCurrentPattern()
    if (!pattern) return

    this.isPlaying = true

    // Calculate step duration in milliseconds
    const stepDuration = (60 * 1000) / (this.tempo * (pattern.stepsPerBar / 4))

    // Start playback loop
    this.intervalId = window.setInterval(() => {
      this.playCurrentStep()

      // Advance to next step
      this.currentStep = (this.currentStep + 1) % (pattern.stepsPerBar * pattern.barsPerPattern)
    }, stepDuration)
  }

  private playCurrentStep(): void {
    const pattern = this.getCurrentPattern()
    if (!pattern) return

    // Play all active steps in all tracks
    pattern.tracks.forEach((track) => {
      const step = track.steps[this.currentStep]
      if (step && step.active) {
        this.sampleManager.playPad(track.padId)
      }
    })
  }

  public stop(): void {
    if (!this.isPlaying) return

    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isPlaying = false
    this.currentStep = 0
  }

  public isSequencerPlaying(): boolean {
    return this.isPlaying
  }

  public getCurrentStep(): number {
    return this.currentStep
  }
}

export default Sequencer

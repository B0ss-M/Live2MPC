import type { Sample } from "../sample-manager"

export interface VelocityLayer {
  sample: Sample
  lowVelocity: number
  highVelocity: number
}

export class VelocityLayerManager {
  /**
   * Assigns velocity ranges across samples.
   * Each layer gets a range of velocity values.
   */
  public assignVelocityRanges(samples: Sample[], numLayers = 1): VelocityLayer[] {
    const velocityStep = Math.floor(127 / numLayers)
    const layeredSamples: VelocityLayer[] = []

    samples.forEach((sample, idx) => {
      const layer = idx % numLayers
      const low = 1 + layer * velocityStep
      const high = Math.min(low + velocityStep - 1, 127)

      layeredSamples.push({
        sample,
        lowVelocity: low,
        highVelocity: high,
      })
    })

    return layeredSamples
  }

  /**
   * Generates velocity layers for samples grouped by key.
   */
  public generateVelocityLayers(samplesByKey: Map<number, Sample[]>): Map<number, VelocityLayer[]> {
    const layers = new Map<number, VelocityLayer[]>()

    samplesByKey.forEach((samples, key) => {
      const velocityLayers: VelocityLayer[] = []
      const step = Math.floor(128 / Math.max(samples.length, 1))

      samples.forEach((sample, i) => {
        const lowVelocity = i * step + 1
        const highVelocity = i < samples.length - 1 ? (i + 1) * step : 127

        velocityLayers.push({
          sample,
          lowVelocity,
          highVelocity,
        })
      })

      layers.set(key, velocityLayers)
    })

    return layers
  }

  /**
   * Groups samples by velocity based on filename hints.
   */
  public groupSamplesByVelocity(samples: Sample[]): Map<number, Sample[]> {
    const velocityGroups = new Map<number, Sample[]>()

    samples.forEach((sample) => {
      let velocity = 100 // default

      // Check filename for velocity hints
      const name = sample.name.toLowerCase()
      if (name.includes("soft") || name.includes("p_") || name.includes("_p")) {
        velocity = 40
      } else if (name.includes("med") || name.includes("mp_") || name.includes("_mp")) {
        velocity = 80
      } else if (name.includes("hard") || name.includes("f_") || name.includes("_f")) {
        velocity = 120
      }

      if (!velocityGroups.has(velocity)) {
        velocityGroups.set(velocity, [])
      }

      velocityGroups.get(velocity)?.push(sample)
    })

    return velocityGroups
  }

  /**
   * Organizes samples into velocity layers based on filename patterns.
   */
  public organizeVelocityLayers(samples: Sample[]): Map<number, Sample[]> {
    // Group samples by note name first
    const samplesByNote = new Map<string, Sample[]>()

    samples.forEach((sample) => {
      const noteName = this.extractNoteFromFilename(sample.name)
      if (!noteName) return

      if (!samplesByNote.has(noteName)) {
        samplesByNote.set(noteName, [])
      }

      samplesByNote.get(noteName)?.push(sample)
    })

    // Convert note names to MIDI notes and organize by velocity
    const samplesByKey = new Map<number, Sample[]>()

    samplesByNote.forEach((noteSamples, noteName) => {
      const midiNote = this.noteNameToMidi(noteName)
      if (midiNote === -1) return

      // Sort samples by velocity indicators in filename
      noteSamples.sort((a, b) => {
        const velocityA = this.extractVelocityFromFilename(a.name)
        const velocityB = this.extractVelocityFromFilename(b.name)
        return velocityA - velocityB
      })

      samplesByKey.set(midiNote, noteSamples)
    })

    return samplesByKey
  }

  private extractNoteFromFilename(filename: string): string | null {
    // Look for common note name patterns like C3, A#4, etc.
    const notePattern = /([A-Ga-g][#b]?[0-9])/
    const match = notePattern.exec(filename)
    return match ? match[1].toUpperCase() : null
  }

  private noteNameToMidi(noteName: string): number {
    const noteMap: { [key: string]: number } = {
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
    }

    // Extract note and octave
    const noteRegex = /([A-G][#b]?)([0-9])/i
    const match = noteRegex.exec(noteName)

    if (!match) return -1

    const note = match[1].toUpperCase()
    const octave = Number.parseInt(match[2], 10)

    // Calculate MIDI note number
    return (octave + 1) * 12 + (noteMap[note] || 0)
  }

  private extractVelocityFromFilename(filename: string): number {
    const name = filename.toLowerCase()

    // Check for explicit velocity numbers
    const velocityMatch = /vel(\d+)/i.exec(name) || /v(\d+)/i.exec(name)
    if (velocityMatch) {
      const vel = Number.parseInt(velocityMatch[1], 10)
      if (vel >= 0 && vel <= 127) {
        return vel
      }
    }

    // Check for velocity words
    if (name.includes("ppp") || name.includes("pianississimo")) return 10
    if (name.includes("pp") || name.includes("pianissimo")) return 25
    if (name.includes("p") || name.includes("piano")) return 40
    if (name.includes("mp") || name.includes("mezzo-piano")) return 60
    if (name.includes("mf") || name.includes("mezzo-forte")) return 80
    if (name.includes("f") || name.includes("forte")) return 100
    if (name.includes("ff") || name.includes("fortissimo")) return 115
    if (name.includes("fff") || name.includes("fortississimo")) return 127

    // Default velocity
    return 90
  }
}

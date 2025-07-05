import { XPMWriter } from "./xpm-writer"
import { detectPitch } from "./pitch-detection"
import SampleManager from "../sample-manager"
import type { Sample } from "../sample-manager"

export interface SampleInfo {
  id: string
  noteName: string | null
  velocity: number
  pitch: number | null
}

export class MultiLayerExporter {
  private xpmWriter: XPMWriter

  constructor(instrumentName: string) {
    this.xpmWriter = new XPMWriter(instrumentName)
  }

  public async processAndExport(sampleIds: string[]): Promise<string> {
    const zones: {
      file: string
      root: number
      low: number
      high: number
      velLow: number
      velHigh: number
    }[] = []

    const sampleManager = SampleManager.getInstance()

    for (const sampleId of sampleIds) {
      const sample = sampleManager.getSample(sampleId)
      if (!sample || !sample.buffer) continue

      const sampleInfo = await this.extractSampleInfo(sample)
      if (!sampleInfo.pitch) continue

      zones.push({
        file: sample.name,
        root: sampleInfo.pitch,
        low: sampleInfo.pitch,
        high: sampleInfo.pitch,
        velLow: sampleInfo.velocity,
        velHigh: sampleInfo.velocity,
      })
    }

    // Group zones by pitch and assign velocity ranges
    const groupedZones = this.assignVelocityRanges(zones)

    return this.xpmWriter.generateXPMContent(groupedZones)
  }

  private async extractSampleInfo(sample: Sample): Promise<SampleInfo> {
    const info: SampleInfo = {
      id: sample.id,
      noteName: null,
      velocity: 127, // default
      pitch: null,
    }

    // Try to extract note name from filename
    info.noteName = this.extractNoteFromFilename(sample.name)

    // Extract velocity from filename
    info.velocity = this.extractVelocityFromFilename(sample.name)

    // Detect pitch
    if (sample.buffer) {
      try {
        const pitchInfo = await detectPitch(sample.buffer)
        if (pitchInfo) {
          info.pitch = pitchInfo.midiNote
        } else if (info.noteName) {
          // Use note from filename if pitch detection failed
          info.pitch = this.noteToMidi(info.noteName)
        }
      } catch (error) {
        console.error("Failed to detect pitch:", error)
      }
    }

    return info
  }

  private extractNoteFromFilename(filename: string): string | null {
    const match = /([A-Ga-g][#b]?[0-9])/.exec(filename)
    return match ? match[1].toUpperCase() : null
  }

  private extractVelocityFromFilename(filename: string): number {
    const name = filename.toLowerCase()

    if (name.includes("soft")) {
      return 40
    } else if (name.includes("med")) {
      return 80
    } else if (name.includes("hard")) {
      return 120
    }

    return 100 // default
  }

  private noteToMidi(noteName: string): number {
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

  private assignVelocityRanges(
    zones: {
      file: string
      root: number
      low: number
      high: number
      velLow: number
      velHigh: number
    }[],
  ): {
    file: string
    root: number
    low: number
    high: number
    velLow: number
    velHigh: number
  }[] {
    // Group zones by root note
    const zonesByRoot: { [root: number]: typeof zones } = {}

    for (const zone of zones) {
      if (!zonesByRoot[zone.root]) {
        zonesByRoot[zone.root] = []
      }

      zonesByRoot[zone.root].push(zone)
    }

    // For each root note, assign velocity ranges
    const result: typeof zones = []

    for (const root in zonesByRoot) {
      const rootZones = zonesByRoot[root]

      // Sort by velocity
      rootZones.sort((a, b) => a.velLow - b.velLow)

      // If there's only one sample for this root, use full velocity range
      if (rootZones.length === 1) {
        rootZones[0].velLow = 0
        rootZones[0].velHigh = 127
        result.push(rootZones[0])
        continue
      }

      // Distribute velocity ranges
      const rangeSize = 128 / rootZones.length

      for (let i = 0; i < rootZones.length; i++) {
        const zone = rootZones[i]
        zone.velLow = Math.floor(i * rangeSize)
        zone.velHigh = Math.floor((i + 1) * rangeSize - 1)

        // Make sure the last zone goes to 127
        if (i === rootZones.length - 1) {
          zone.velHigh = 127
        }

        result.push(zone)
      }
    }

    return result
  }
}

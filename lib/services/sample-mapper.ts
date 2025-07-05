import { detectPitch } from "./pitch-detection"
import SampleManager, { type Sample } from "../sample-manager"

export interface MappedSample {
  id: string
  midiNote: number
  velocity: number
  rootPitch: string
}

export async function autoMapSamples(sampleIds: string[]): Promise<MappedSample[]> {
  const sampleManager = SampleManager.getInstance()
  const mappedSamples: MappedSample[] = []

  for (const sampleId of sampleIds) {
    const sample = sampleManager.getSample(sampleId)
    if (!sample || !sample.buffer) continue

    // Try to extract note from filename first
    const noteFromFilename = extractNoteFromFilename(sample.name)
    let midiNote: number | null = null

    if (noteFromFilename) {
      midiNote = noteToMidi(noteFromFilename)
    }

    // If we couldn't get note from filename, try pitch detection
    if (midiNote === null) {
      try {
        const pitchInfo = await detectPitch(sample.buffer)
        if (pitchInfo) {
          midiNote = pitchInfo.midiNote
        }
      } catch (error) {
        console.error("Failed to detect pitch:", error)
      }
    }

    if (midiNote !== null) {
      mappedSamples.push({
        id: sampleId,
        midiNote,
        velocity: 127, // default, to be refined
        rootPitch: noteFromFilename || "Unknown",
      })
    }
  }

  return mappedSamples
}

export function groupByVelocity(samples: Sample[]): { [velocity: number]: Sample[] } {
  const velocityGroups: { [velocity: number]: Sample[] } = {}

  for (const sample of samples) {
    let velocity = 100 // default

    // Check filename for velocity hints
    const name = sample.name.toLowerCase()
    if (name.includes("soft")) {
      velocity = 40
    } else if (name.includes("med")) {
      velocity = 80
    } else if (name.includes("hard")) {
      velocity = 120
    }

    if (!velocityGroups[velocity]) {
      velocityGroups[velocity] = []
    }

    velocityGroups[velocity].push(sample)
  }

  return velocityGroups
}

function extractNoteFromFilename(filename: string): string | null {
  const match = /([A-Ga-g][#b]?[0-9])/.exec(filename)
  return match ? match[1].toUpperCase() : null
}

function noteToMidi(noteName: string): number {
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

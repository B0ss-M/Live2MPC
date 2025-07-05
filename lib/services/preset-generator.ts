import { XPMWriter } from "./xpm-writer"
import { detectPitch } from "./pitch-detection"
import SampleManager, { type Sample } from "../sample-manager"

export interface PresetOptions {
  name: string
  type: "drumkit" | "instrument"
  includePreview: boolean
}

export class PresetGenerator {
  private sampleManager: SampleManager
  private xpmWriter: XPMWriter

  constructor(options: PresetOptions) {
    this.sampleManager = SampleManager.getInstance()
    this.xpmWriter = new XPMWriter(options.name, options.type)
  }

  public async generatePreset(sampleIds: string[]): Promise<Blob> {
    const samples = sampleIds
      .map((id) => this.sampleManager.getSample(id))
      .filter((sample): sample is Sample => !!sample)

    if (samples.length === 0) {
      throw new Error("No valid samples provided")
    }

    if (this.xpmWriter.programType === "drumkit") {
      return this.generateDrumkitPreset(samples)
    } else {
      return this.generateInstrumentPreset(samples)
    }
  }

  private async generateDrumkitPreset(samples: Sample[]): Promise<Blob> {
    // Create pad assignments
    const padAssignments: { [padId: string]: string } = {}

    // Assign samples to pads (A01, A02, etc.)
    const banks = ["A", "B", "C", "D", "E", "F", "G", "H"]
    let bankIndex = 0
    let padIndex = 0

    for (const sample of samples) {
      if (bankIndex >= banks.length) break

      const bank = banks[bankIndex]
      const padLabel = `${bank}${(padIndex + 1).toString().padStart(2, "0")}`
      padAssignments[padLabel] = sample.id

      padIndex++
      if (padIndex === 16) {
        padIndex = 0
        bankIndex++
      }
    }

    // Generate XPM content
    const xpmContent = this.xpmWriter.createDrumKitXPM(this.xpmWriter.instrumentName, padAssignments)

    // Create a blob with the XPM content
    return new Blob([xpmContent], { type: "text/plain" })
  }

  private async generateInstrumentPreset(samples: Sample[]): Promise<Blob> {
    // Analyze samples to extract pitch information
    const analyzedSamples: { sample: Sample; midiNote: number | null }[] = []

    for (const sample of samples) {
      let midiNote: number | null = null

      // Try to extract note from filename first
      const noteFromFilename = this.extractNoteFromFilename(sample.name)
      if (noteFromFilename) {
        midiNote = this.noteToMidi(noteFromFilename)
      }

      // If we couldn't get note from filename and we have a buffer, try pitch detection
      if (midiNote === null && sample.buffer) {
        try {
          const pitchInfo = await detectPitch(sample.buffer)
          if (pitchInfo) {
            midiNote = pitchInfo.midiNote
          }
        } catch (error) {
          console.error("Failed to detect pitch:", error)
        }
      }

      analyzedSamples.push({
        sample,
        midiNote: midiNote !== null ? midiNote : 60, // Default to middle C if no pitch detected
      })
    }

    // Sort samples by MIDI note
    analyzedSamples.sort((a, b) => {
      if (a.midiNote === null) return 1
      if (b.midiNote === null) return -1
      return a.midiNote - b.midiNote
    })

    // Create keygroups
    const instrument = {
      id: `instrument_${Date.now()}`,
      name: this.xpmWriter.instrumentName,
      keygroups: analyzedSamples.map((item, index) => {
        // Calculate note range
        let lowNote = item.midiNote || 60
        let highNote = item.midiNote || 60

        if (index > 0 && analyzedSamples[index - 1].midiNote !== null) {
          // Extend range down to midpoint between this and previous note
          lowNote = Math.floor((analyzedSamples[index - 1].midiNote! + (item.midiNote || 60)) / 2) + 1
        } else {
          // First sample extends down to 0
          lowNote = 0
        }

        if (index < analyzedSamples.length - 1 && analyzedSamples[index + 1].midiNote !== null) {
          // Extend range up to midpoint between this and next note
          highNote = Math.floor(((item.midiNote || 60) + analyzedSamples[index + 1].midiNote!) / 2)
        } else {
          // Last sample extends up to 127
          highNote = 127
        }

        return {
          id: `keygroup_${index}`,
          lowNote,
          highNote,
          rootNote: item.midiNote || 60,
          velocityLayers: [
            {
              id: `velocity_${index}_0`,
              lowVelocity: 0,
              highVelocity: 127,
              sampleId: item.sample.id,
            },
          ],
        }
      }),
    }

    // Generate XPM content
    const xpmContent = this.xpmWriter.createXPM(instrument)

    // Create a blob with the XPM content
    return new Blob([xpmContent], { type: "text/plain" })
  }

  private extractNoteFromFilename(filename: string): string | null {
    const match = /([A-Ga-g][#b]?[0-9])/.exec(filename)
    return match ? match[1].toUpperCase() : null
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

    if (!match) return 60 // Default to middle C

    const note = match[1].toUpperCase()
    const octave = Number.parseInt(match[2], 10)

    // Calculate MIDI note number
    return (octave + 1) * 12 + (noteMap[note] || 0)
  }
}

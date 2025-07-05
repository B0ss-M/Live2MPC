import type { Sample } from "../sample-manager"
import { XPMGenerator } from "./xpm-generator"
import { VelocityLayerManager } from "./velocity-layer-manager"
import { SampleAnalyzer } from "./sample-analyzer"
import { detectPitch } from "./pitch-detection"

export interface XPMFixOptions {
  autoMapSamples?: boolean
  detectVelocityLayers?: boolean
  optimizeKeyRanges?: boolean
  validateSamples?: boolean
}

export class XPMUtils {
  private xpmGenerator: XPMGenerator
  private velocityLayerManager: VelocityLayerManager
  private sampleAnalyzer: SampleAnalyzer

  constructor(name: string, type: "drumkit" | "instrument") {
    this.xpmGenerator = new XPMGenerator({ name, type, includeSettings: true })
    this.velocityLayerManager = new VelocityLayerManager()
    this.sampleAnalyzer = new SampleAnalyzer()
  }

  /**
   * Creates an XPM file from a collection of samples
   */
  public async createXPM(samples: Sample[], options: XPMFixOptions = {}): Promise<string> {
    // Validate samples if requested
    let processedSamples = samples
    if (options.validateSamples) {
      const { valid } = this.sampleAnalyzer.validateSamples(samples)
      processedSamples = valid
    }

    // For drum kits, just generate a simple XPM
    if (this.xpmGenerator.options.type === "drumkit") {
      return this.xpmGenerator.generateDrumKitXPM(processedSamples)
    }

    // For instruments, we need to map samples to keys
    let keyMapping = new Map<number, Sample>()

    if (options.autoMapSamples) {
      keyMapping = await this.mapSamplesToKeys(processedSamples)
    }

    // If we should detect velocity layers
    if (options.detectVelocityLayers) {
      const samplesByKey = this.velocityLayerManager.organizeVelocityLayers(processedSamples)
      return this.xpmGenerator.generateMultiVelocityXPM(processedSamples, samplesByKey)
    }

    return this.xpmGenerator.generateInstrumentXPM(processedSamples, keyMapping)
  }

  /**
   * Maps samples to MIDI note numbers based on filename or pitch detection
   */
  private async mapSamplesToKeys(samples: Sample[]): Promise<Map<number, Sample>> {
    const keyMapping = new Map<number, Sample>()

    for (const sample of samples) {
      // Try to extract note from filename first
      let midiNote = this.extractMidiNoteFromFilename(sample.name)

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

      // If we found a MIDI note, add it to the mapping
      if (midiNote !== null) {
        keyMapping.set(midiNote, sample)
      }
    }

    return keyMapping
  }

  /**
   * Extracts MIDI note number from a filename
   */
  private extractMidiNoteFromFilename(filename: string): number | null {
    // Look for common note name patterns like C3, A#4, etc.
    const notePattern = /([A-Ga-g][#b]?[0-9])/i
    const match = notePattern.exec(filename)

    if (!match) return null

    const noteName = match[1].toUpperCase()
    return this.noteNameToMidi(noteName)
  }

  /**
   * Converts a note name (e.g., "C3") to a MIDI note number
   */
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

  /**
   * Fixes common issues in XPM content
   */
  public fixXPMContent(xpmContent: string): string {
    // Fix XML declaration if missing
    if (!xpmContent.includes("<?xml")) {
      xpmContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + xpmContent
    }

    // Fix missing attributes
    xpmContent = xpmContent.replace(/<Sample([^>]*)>/g, (match, attributes) => {
      if (!attributes.includes("path=")) {
        // Extract name if it exists
        const nameMatch = /name="([^"]+)"/.exec(attributes)
        if (nameMatch) {
          return `<Sample${attributes} path="${nameMatch[1]}">`
        }
      }
      return match
    })

    // Fix missing closing tags
    const openTags = ["DrumProgram", "KeygroupProgram", "Pads", "Keygroups", "Pad", "Keygroup", "Zone", "Sample"]
    openTags.forEach((tag) => {
      const openCount = (xpmContent.match(new RegExp(`<${tag}[^>]*>`, "g")) || []).length
      const closeCount = (xpmContent.match(new RegExp(`</${tag}>`, "g")) || []).length

      if (openCount > closeCount) {
        xpmContent += `</${tag}>\n`.repeat(openCount - closeCount)
      }
    })

    return xpmContent
  }
}

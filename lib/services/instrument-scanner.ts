import SampleManager, { type Sample } from "../sample-manager"

export interface ScannedInstrument {
  id: string
  name: string
  type: "drumkit" | "instrument"
  samples: Sample[]
}

export class InstrumentScanner {
  private sampleManager: SampleManager
  private readonly SUPPORTED_EXTENSIONS = [".wav", ".mp3", ".aiff", ".ogg"]

  constructor() {
    this.sampleManager = SampleManager.getInstance()
  }

  public async scanForInstruments(): Promise<ScannedInstrument[]> {
    // In a real implementation, this would scan the file system
    // For our web app, we'll scan the loaded samples

    const samples = this.sampleManager.getAllSamples()
    if (samples.length === 0) return []

    // Group samples by potential instruments
    const instruments: ScannedInstrument[] = []

    // Group by common prefixes in filenames
    const groupedByPrefix = this.groupSamplesByPrefix(samples)

    // Create instruments from groups
    for (const [prefix, groupSamples] of Object.entries(groupedByPrefix)) {
      if (groupSamples.length < 2) continue // Skip single samples

      const type = this.classifyInstrumentType(groupSamples)

      instruments.push({
        id: `scanned_${Date.now()}_${instruments.length}`,
        name: this.generateInstrumentName(prefix),
        type,
        samples: groupSamples,
      })
    }

    return instruments
  }

  private groupSamplesByPrefix(samples: Sample[]): { [prefix: string]: Sample[] } {
    const groups: { [prefix: string]: Sample[] } = {}

    for (const sample of samples) {
      // Extract prefix (e.g., "Piano" from "Piano_C3.wav")
      const parts = sample.name.split(/[_\s-]/)
      const prefix = parts[0]

      if (!groups[prefix]) {
        groups[prefix] = []
      }

      groups[prefix].push(sample)
    }

    return groups
  }

  private classifyInstrumentType(samples: Sample[]): "drumkit" | "instrument" {
    // Check if samples have drum-related names
    const drumKeywords = ["kick", "snare", "hat", "tom", "cymbal", "perc", "drum", "clap"]

    let drumCount = 0
    for (const sample of samples) {
      const name = sample.name.toLowerCase()
      if (drumKeywords.some((keyword) => name.includes(keyword))) {
        drumCount++
      }
    }

    // If more than 30% of samples have drum-related names, classify as drumkit
    return drumCount > samples.length * 0.3 ? "drumkit" : "instrument"
  }

  private generateInstrumentName(prefix: string): string {
    // Capitalize first letter
    return prefix.charAt(0).toUpperCase() + prefix.slice(1)
  }

  public async validateSamples(samples: Sample[]): Promise<{ valid: Sample[]; invalid: Sample[] }> {
    const valid: Sample[] = []
    const invalid: Sample[] = []

    for (const sample of samples) {
      // Check if sample has a valid extension
      const extension = this.getFileExtension(sample.name).toLowerCase()
      const isValidExtension = this.SUPPORTED_EXTENSIONS.includes(extension)

      // Check if sample has audio data
      const hasAudioData = !!sample.buffer

      if (isValidExtension && hasAudioData) {
        valid.push(sample)
      } else {
        invalid.push(sample)
      }
    }

    return { valid, invalid }
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split(".")
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : ""
  }
}

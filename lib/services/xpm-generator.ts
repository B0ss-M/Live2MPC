import type { Sample } from "../sample-manager"

export interface XPMOptions {
  name: string
  type: "drumkit" | "instrument"
  includeSettings?: boolean
  useRelativePaths?: boolean
  outputDirectory?: string
}

export class XPMGenerator {
  private options: XPMOptions

  constructor(options: XPMOptions) {
    this.options = {
      useRelativePaths: true,
      ...options,
    }
  }

  public generateDrumKitXPM(samples: Sample[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += `<DrumProgram name="${this.options.name}">\n`
    xml += "  <Pads>\n"

    samples.forEach((sample, index) => {
      if (!sample) return

      const samplePath = this.formatSamplePath(sample.name)

      xml += `    <Pad padIndex="${index}">\n`
      xml += `      <Sample name="${sample.name}" path="${samplePath}"/>\n`

      if (this.options.includeSettings) {
        xml += '      <Settings level="1.0" pan="0.0" tune="0"/>\n'
      }

      xml += "    </Pad>\n"
    })

    xml += "  </Pads>\n"
    xml += "</DrumProgram>"

    return xml
  }

  public generateInstrumentXPM(samples: Sample[], keyMapping: Map<number, Sample>): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += `<KeygroupProgram name="${this.options.name}">\n`
    xml += "  <Keygroups>\n"

    // Convert the key mapping to an array and sort by key
    const sortedEntries = Array.from(keyMapping.entries()).sort((a, b) => a[0] - b[0])

    sortedEntries.forEach(([midiNote, sample], index) => {
      if (!sample) return

      const samplePath = this.formatSamplePath(sample.name)

      // Calculate key range (use neighboring notes as boundaries)
      let lowKey = midiNote
      let highKey = midiNote

      if (index > 0) {
        // Set low key to midpoint between this and previous note
        const prevNote = sortedEntries[index - 1][0]
        lowKey = Math.floor((prevNote + midiNote) / 2) + 1
      } else {
        // First sample extends down to 0
        lowKey = 0
      }

      if (index < sortedEntries.length - 1) {
        // Set high key to midpoint between this and next note
        const nextNote = sortedEntries[index + 1][0]
        highKey = Math.floor((midiNote + nextNote) / 2)
      } else {
        // Last sample extends up to 127
        highKey = 127
      }

      xml += `    <Keygroup index="${index}">\n`
      xml += `      <Zone>\n`
      xml += `        <Sample name="${sample.name}" path="${samplePath}"/>\n`
      xml += `        <KeyRange root="${midiNote}" low="${lowKey}" high="${highKey}"/>\n`
      xml += `        <VelocityRange low="1" high="127"/>\n`
      xml += "      </Zone>\n"
      xml += "    </Keygroup>\n"
    })

    xml += "  </Keygroups>\n"
    xml += "</KeygroupProgram>"

    return xml
  }

  public generateMultiVelocityXPM(samples: Sample[], keyVelocityMapping: Map<number, Sample[]>): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += `<KeygroupProgram name="${this.options.name}">\n`
    xml += "  <Keygroups>\n"

    // Convert the key mapping to an array and sort by key
    const sortedEntries = Array.from(keyVelocityMapping.entries()).sort((a, b) => a[0] - b[0])

    sortedEntries.forEach(([midiNote, velocitySamples], index) => {
      if (!velocitySamples || velocitySamples.length === 0) return

      // Calculate key range (use neighboring notes as boundaries)
      let lowKey = midiNote
      let highKey = midiNote

      if (index > 0) {
        // Set low key to midpoint between this and previous note
        const prevNote = sortedEntries[index - 1][0]
        lowKey = Math.floor((prevNote + midiNote) / 2) + 1
      } else {
        // First sample extends down to 0
        lowKey = 0
      }

      if (index < sortedEntries.length - 1) {
        // Set high key to midpoint between this and next note
        const nextNote = sortedEntries[index + 1][0]
        highKey = Math.floor((midiNote + nextNote) / 2)
      } else {
        // Last sample extends up to 127
        highKey = 127
      }

      xml += `    <Keygroup index="${index}">\n`

      // Calculate velocity ranges for each sample
      const velocityStep = Math.floor(127 / velocitySamples.length)

      velocitySamples.forEach((sample, velIndex) => {
        const lowVel = velIndex * velocityStep + 1
        const highVel = velIndex === velocitySamples.length - 1 ? 127 : (velIndex + 1) * velocityStep
        const samplePath = this.formatSamplePath(sample.name)

        xml += `      <Zone>\n`
        xml += `        <Sample name="${sample.name}" path="${samplePath}"/>\n`
        xml += `        <KeyRange root="${midiNote}" low="${lowKey}" high="${highKey}"/>\n`
        xml += `        <VelocityRange low="${lowVel}" high="${highVel}"/>\n`
        xml += "      </Zone>\n"
      })

      xml += "    </Keygroup>\n"
    })

    xml += "  </Keygroups>\n"
    xml += "</KeygroupProgram>"

    return xml
  }

  // New method to format sample paths based on options
  private formatSamplePath(sampleName: string): string {
    if (!this.options.useRelativePaths) {
      return sampleName
    }

    // Clean up the sample name to be a valid path
    const cleanName = sampleName.replace(/[\\/:*?"<>|]/g, "_")

    // If output directory is specified, create a relative path
    if (this.options.outputDirectory) {
      // Calculate relative path from output directory to samples directory
      return `./samples/${cleanName}`
    }

    // Default to samples subdirectory
    return `samples/${cleanName}`
  }
}

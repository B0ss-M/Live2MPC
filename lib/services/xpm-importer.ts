import type { Sample } from "../sample-manager"
import SampleManager from "../sample-manager"

export interface XPMProgram {
  name: string
  type: "drumkit" | "instrument"
  samples: XPMSample[]
  keygroups?: XPMKeygroup[]
  pads?: XPMPad[]
}

export interface XPMSample {
  name: string
  path: string
}

export interface XPMKeygroup {
  index: number
  zones: XPMZone[]
}

export interface XPMZone {
  sample: XPMSample
  keyRange: {
    root: number
    low: number
    high: number
  }
  velocityRange: {
    low: number
    high: number
  }
}

export interface XPMPad {
  index: number
  sample: XPMSample
  settings?: {
    level: number
    pan: number
    tune: number
  }
}

export class XPMImporter {
  private sampleManager: SampleManager

  constructor() {
    this.sampleManager = SampleManager.getInstance()
  }

  /**
   * Parses an XPM file and returns the program data
   */
  public async parseXPMFile(file: File): Promise<XPMProgram> {
    try {
      // Read the file as text
      const text = await file.text()

      // Parse the XPM content
      return this.parseXPMContent(text)
    } catch (error) {
      console.error("Error parsing XPM file:", error)
      throw new Error(`Failed to parse XPM file: ${error}`)
    }
  }

  /**
   * Parses XPM content and returns the program data
   */
  public parseXPMContent(content: string): XPMProgram {
    try {
      // Create a DOM parser
      const parser = new DOMParser()

      // Parse the XML content
      const xmlDoc = parser.parseFromString(content, "text/xml")

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror")
      if (parserError) {
        throw new Error("XML parsing error: " + parserError.textContent)
      }

      // Determine the program type
      const rootElement = xmlDoc.documentElement
      const programType = this.determineProgramType(rootElement)

      // Extract program name
      const programName = rootElement.getAttribute("name") || "Imported Program"

      // Create the program object
      const program: XPMProgram = {
        name: programName,
        type: programType,
        samples: [],
      }

      // Extract samples, keygroups, and pads based on program type
      if (programType === "instrument") {
        program.keygroups = this.extractKeygroups(xmlDoc)

        // Collect all samples from keygroups
        const samples = new Set<string>()
        program.keygroups.forEach((keygroup) => {
          keygroup.zones.forEach((zone) => {
            samples.add(zone.sample.path)
          })
        })

        // Add unique samples to the program
        program.samples = Array.from(samples).map((path) => {
          const name = this.extractFilenameFromPath(path)
          return { name, path }
        })
      } else {
        program.pads = this.extractPads(xmlDoc)

        // Collect all samples from pads
        const samples = new Set<string>()
        program.pads.forEach((pad) => {
          samples.add(pad.sample.path)
        })

        // Add unique samples to the program
        program.samples = Array.from(samples).map((path) => {
          const name = this.extractFilenameFromPath(path)
          return { name, path }
        })
      }

      return program
    } catch (error) {
      console.error("Error parsing XPM content:", error)
      throw new Error(`Failed to parse XPM content: ${error}`)
    }
  }

  /**
   * Determines the program type from the root element
   */
  private determineProgramType(rootElement: Element): "drumkit" | "instrument" {
    const nodeName = rootElement.nodeName.toLowerCase()

    if (
      nodeName === "drumprogram" ||
      (nodeName === "pluginprogram" && rootElement.getAttribute("type") === "drumkit")
    ) {
      return "drumkit"
    }

    return "instrument"
  }

  /**
   * Extracts keygroups from the XML document
   */
  private extractKeygroups(xmlDoc: Document): XPMKeygroup[] {
    const keygroups: XPMKeygroup[] = []

    // Find all keygroup elements
    const keygroupElements = xmlDoc.querySelectorAll("Keygroup")

    keygroupElements.forEach((keygroupElement, index) => {
      const keygroup: XPMKeygroup = {
        index: Number.parseInt(keygroupElement.getAttribute("index") || String(index), 10),
        zones: [],
      }

      // Find all zone elements within this keygroup
      const zoneElements = keygroupElement.querySelectorAll("Zone")

      zoneElements.forEach((zoneElement) => {
        // Extract sample information
        const sampleElement = zoneElement.querySelector("Sample")
        if (!sampleElement) return

        const sampleName = sampleElement.getAttribute("name") || ""
        const samplePath = sampleElement.getAttribute("path") || sampleName

        // Extract key range information
        const keyRangeElement = zoneElement.querySelector("KeyRange")
        const root = Number.parseInt(keyRangeElement?.getAttribute("root") || "60", 10)
        const low = Number.parseInt(keyRangeElement?.getAttribute("low") || "0", 10)
        const high = Number.parseInt(keyRangeElement?.getAttribute("high") || "127", 10)

        // Extract velocity range information
        const velocityRangeElement = zoneElement.querySelector("VelocityRange")
        const velLow = Number.parseInt(velocityRangeElement?.getAttribute("low") || "1", 10)
        const velHigh = Number.parseInt(velocityRangeElement?.getAttribute("high") || "127", 10)

        // Create the zone object
        const zone: XPMZone = {
          sample: {
            name: sampleName,
            path: samplePath,
          },
          keyRange: {
            root,
            low,
            high,
          },
          velocityRange: {
            low: velLow,
            high: velHigh,
          },
        }

        keygroup.zones.push(zone)
      })

      keygroups.push(keygroup)
    })

    return keygroups
  }

  /**
   * Extracts pads from the XML document
   */
  private extractPads(xmlDoc: Document): XPMPad[] {
    const pads: XPMPad[] = []

    // Find all pad elements
    const padElements = xmlDoc.querySelectorAll("Pad")

    padElements.forEach((padElement, index) => {
      // Extract pad index
      const padIndex = Number.parseInt(
        padElement.getAttribute("padIndex") || padElement.getAttribute("id") || String(index),
        10,
      )

      // Extract sample information
      const sampleElement = padElement.querySelector("Sample")
      if (!sampleElement) return

      const sampleName = sampleElement.getAttribute("name") || ""
      const samplePath = sampleElement.getAttribute("path") || sampleName

      // Extract settings information
      const settingsElement = padElement.querySelector("Settings")
      let settings = undefined

      if (settingsElement) {
        settings = {
          level: Number.parseFloat(settingsElement.getAttribute("level") || "1.0"),
          pan: Number.parseFloat(settingsElement.getAttribute("pan") || "0.0"),
          tune: Number.parseInt(settingsElement.getAttribute("tune") || "0", 10),
        }
      }

      // Create the pad object
      const pad: XPMPad = {
        index: padIndex,
        sample: {
          name: sampleName,
          path: samplePath,
        },
        settings,
      }

      pads.push(pad)
    })

    return pads
  }

  /**
   * Extracts filename from a path
   */
  private extractFilenameFromPath(path: string): string {
    // Replace backslashes with forward slashes for consistency
    const normalizedPath = path.replace(/\\/g, "/")

    // Split the path by forward slashes
    const parts = normalizedPath.split("/")

    // Return the last part (the filename)
    return parts[parts.length - 1]
  }

  /**
   * Imports an XPM program and loads the samples
   */
  public async importProgram(program: XPMProgram, sampleFiles: File[]): Promise<Sample[]> {
    const loadedSamples: Sample[] = []

    // Create a map of filenames to sample files for quick lookup
    const fileMap = new Map<string, File>()
    sampleFiles.forEach((file) => {
      fileMap.set(file.name.toLowerCase(), file)
    })

    // Load each sample in the program
    for (const xpmSample of program.samples) {
      const filename = this.extractFilenameFromPath(xpmSample.path)

      // Look for the sample file in the provided files
      const file = fileMap.get(filename.toLowerCase())

      if (file) {
        try {
          // Load the sample
          const sample = await this.sampleManager.loadSample(file)
          loadedSamples.push(sample)
        } catch (error) {
          console.error(`Error loading sample ${filename}:`, error)
        }
      } else {
        console.warn(`Sample file not found: ${filename}`)
      }
    }

    return loadedSamples
  }
}

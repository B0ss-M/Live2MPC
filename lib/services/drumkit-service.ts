import AudioContextManager from "../audio-context"
import SampleManager, { type Sample } from "../sample-manager"
import { XPMWriter } from "./xpm-writer"

export interface DrumKit {
  id: string
  name: string
  pads: DrumPad[]
}

export interface DrumPad {
  id: string
  bankId: string
  padNumber: number
  sampleId: string | null
  label: string
}

export interface DrumKitExportOptions {
  name: string
  includePreview: boolean
  fixXPM: boolean
}

class DrumKitService {
  private static instance: DrumKitService
  private sampleManager: SampleManager
  private audioContext: AudioContextManager
  private drumKits: Map<string, DrumKit> = new Map()

  // Bank configuration based on the Python code
  private readonly MAX_PADS_PER_BANK = 16
  private readonly BANKS = ["A", "B", "C", "D", "E", "F", "G", "H"]

  private constructor() {
    this.sampleManager = SampleManager.getInstance()
    this.audioContext = AudioContextManager.getInstance()
    this.createDefaultKit()
  }

  public static getInstance(): DrumKitService {
    if (!DrumKitService.instance) {
      DrumKitService.instance = new DrumKitService()
    }
    return DrumKitService.instance
  }

  private createDefaultKit(): void {
    const kitId = `kit_${Date.now()}`
    const pads: DrumPad[] = []

    // Create pads for all banks
    this.BANKS.forEach((bankId) => {
      for (let i = 0; i < this.MAX_PADS_PER_BANK; i++) {
        pads.push({
          id: `pad_${bankId}_${i}`,
          bankId,
          padNumber: i,
          sampleId: null,
          label: `${bankId}${(i + 1).toString().padStart(2, "0")}`,
        })
      }
    })

    const kit: DrumKit = {
      id: kitId,
      name: "Default Kit",
      pads,
    }

    this.drumKits.set(kitId, kit)
  }

  public getCurrentKit(): DrumKit {
    // Return the first kit for now
    return Array.from(this.drumKits.values())[0]
  }

  public assignSampleToPad(kitId: string, padId: string, sampleId: string): boolean {
    const kit = this.drumKits.get(kitId)
    if (!kit) return false

    const pad = kit.pads.find((p) => p.id === padId)
    if (!pad) return false

    pad.sampleId = sampleId
    return true
  }

  public getPadSample(kitId: string, padId: string): Sample | null {
    const kit = this.drumKits.get(kitId)
    if (!kit) return null

    const pad = kit.pads.find((p) => p.id === padId)
    if (!pad || !pad.sampleId) return null

    return this.sampleManager.getSample(pad.sampleId) || null
  }

  public async autoAssignSamples(kitId: string, sampleIds: string[]): Promise<number> {
    const kit = this.drumKits.get(kitId)
    if (!kit) return 0

    let assignedCount = 0
    let padIndex = 0

    for (const sampleId of sampleIds) {
      if (padIndex >= kit.pads.length) break

      const pad = kit.pads[padIndex]
      pad.sampleId = sampleId
      padIndex++
      assignedCount++
    }

    return assignedCount
  }

  public async exportKit(kitId: string, options: DrumKitExportOptions): Promise<Blob> {
    const kit = this.drumKits.get(kitId)
    if (!kit) {
      throw new Error(`Kit with ID ${kitId} not found`)
    }

    // Create pad assignments map
    const padAssignments: { [padId: string]: string } = {}

    for (const pad of kit.pads) {
      if (pad.sampleId) {
        padAssignments[pad.label] = pad.sampleId
      }
    }

    // Use the XPM writer to generate the XPM content
    const writer = new XPMWriter(options.name, "drumkit")
    const xpmContent = writer.createDrumKitXPM(options.name, padAssignments)

    // Create a blob with the XPM content
    return new Blob([xpmContent], { type: "text/plain" })
  }

  public async generatePreview(kitId: string): Promise<AudioBuffer | null> {
    const kit = this.drumKits.get(kitId)
    if (!kit) return null

    // Create a silent buffer
    const audioContext = this.audioContext.getContext()
    if (!audioContext) return null

    const duration = 4 // 4 seconds
    const previewBuffer = audioContext.createBuffer(
      2, // stereo
      audioContext.sampleRate * duration,
      audioContext.sampleRate,
    )

    // Get samples with valid assignments
    const validPads = kit.pads.filter((pad) => pad.sampleId !== null)
    if (validPads.length === 0) return previewBuffer

    // Calculate interval between samples
    const interval = duration / Math.min(8, validPads.length)

    // Mix samples into the preview
    let offset = 0
    for (let i = 0; i < Math.min(8, validPads.length); i++) {
      const pad = validPads[i]
      if (!pad.sampleId) continue

      const sample = this.sampleManager.getSample(pad.sampleId)
      if (!sample || !sample.buffer) continue

      // Mix the sample into the preview buffer
      this.mixBuffers(sample.buffer, previewBuffer, offset)
      offset += interval * audioContext.sampleRate
    }

    return previewBuffer
  }

  private mixBuffers(source: AudioBuffer, destination: AudioBuffer, offsetFrames: number): void {
    // Mix source into destination at the specified offset
    const leftSource = source.getChannelData(0)
    const leftDest = destination.getChannelData(0)

    // Handle right channel if available
    const rightSource = source.numberOfChannels > 1 ? source.getChannelData(1) : leftSource
    const rightDest = destination.numberOfChannels > 1 ? destination.getChannelData(1) : leftDest

    const length = Math.min(leftSource.length, leftDest.length - offsetFrames)

    for (let i = 0; i < length; i++) {
      leftDest[i + offsetFrames] += leftSource[i]
      rightDest[i + offsetFrames] += rightSource[i]
    }
  }
}

export default DrumKitService

import { detectPitch } from "./pitch-detection"
import { autoMapSamples } from "./sample-mapper"
import { XPMWriter } from "./xpm-writer"
import { MultiLayerExporter } from "./multi-layer-exporter"
import { validateInstrument } from "./instrument-validator"
import AudioContextManager from "../audio-context"
import SampleManager from "../sample-manager"

export interface Instrument {
  id: string
  name: string
  keygroups: Keygroup[]
}

export interface Keygroup {
  id: string
  lowNote: number
  highNote: number
  rootNote: number
  velocityLayers: VelocityLayer[]
}

export interface VelocityLayer {
  id: string
  lowVelocity: number
  highVelocity: number
  sampleId: string | null
}

export interface InstrumentExportOptions {
  name: string
  includePreview: boolean
  fixXPM: boolean
  useMultiLayerExport?: boolean
}

class InstrumentService {
  private static instance: InstrumentService
  private sampleManager: SampleManager
  private audioContext: AudioContextManager
  private instruments: Map<string, Instrument> = new Map()

  private constructor() {
    this.sampleManager = SampleManager.getInstance()
    this.audioContext = AudioContextManager.getInstance()
    this.createDefaultInstrument()
  }

  public static getInstance(): InstrumentService {
    if (!InstrumentService.instance) {
      InstrumentService.instance = new InstrumentService()
    }
    return InstrumentService.instance
  }

  private createDefaultInstrument(): void {
    const instrumentId = `instrument_${Date.now()}`

    // Create a default keygroup spanning the entire MIDI range
    const keygroups: Keygroup[] = [
      {
        id: `keygroup_0`,
        lowNote: 0,
        highNote: 127,
        rootNote: 60, // Middle C
        velocityLayers: [
          {
            id: `velocity_0`,
            lowVelocity: 0,
            highVelocity: 127,
            sampleId: null,
          },
        ],
      },
    ]

    const instrument: Instrument = {
      id: instrumentId,
      name: "Default Instrument",
      keygroups,
    }

    this.instruments.set(instrumentId, instrument)
  }

  public getCurrentInstrument(): Instrument {
    // Return the first instrument for now
    return Array.from(this.instruments.values())[0]
  }

  public async assignSampleToKeygroup(
    instrumentId: string,
    keygroupId: string,
    velocityLayerId: string,
    sampleId: string,
  ): Promise<boolean> {
    const instrument = this.instruments.get(instrumentId)
    if (!instrument) return false

    const keygroup = instrument.keygroups.find((kg) => kg.id === keygroupId)
    if (!keygroup) return false

    const velocityLayer = keygroup.velocityLayers.find((vl) => vl.id === velocityLayerId)
    if (!velocityLayer) return false

    velocityLayer.sampleId = sampleId

    // Analyze sample to update root note if possible
    const sample = this.sampleManager.getSample(sampleId)
    if (sample && sample.buffer) {
      try {
        const pitchInfo = await detectPitch(sample.buffer)
        if (pitchInfo) {
          keygroup.rootNote = pitchInfo.midiNote
        }
      } catch (error) {
        console.error("Failed to detect pitch:", error)
      }
    }

    return true
  }

  public async autoMapSamples(instrumentId: string, sampleIds: string[]): Promise<number> {
    const instrument = this.instruments.get(instrumentId)
    if (!instrument) return 0

    let assignedCount = 0

    // Use the enhanced auto-mapping functionality
    const mappedSamples = await autoMapSamples(sampleIds)

    if (mappedSamples.length === 0) return 0

    // Sort samples by MIDI note
    mappedSamples.sort((a, b) => a.midiNote - b.midiNote)

    // Create keygroups based on detected notes
    // Clear existing keygroups
    instrument.keygroups = []

    // Create a keygroup for each sample
    for (let i = 0; i < mappedSamples.length; i++) {
      const sample = mappedSamples[i]

      // Calculate note range
      let lowNote = sample.midiNote
      let highNote = sample.midiNote

      if (i > 0) {
        // Extend range down to midpoint between this and previous note
        lowNote = Math.floor((mappedSamples[i - 1].midiNote + sample.midiNote) / 2) + 1
      } else {
        // First sample extends down to 0
        lowNote = 0
      }

      if (i < mappedSamples.length - 1) {
        // Extend range up to midpoint between this and next note
        highNote = Math.floor((sample.midiNote + mappedSamples[i + 1].midiNote) / 2)
      } else {
        // Last sample extends up to 127
        highNote = 127
      }

      // Create keygroup
      const keygroup: Keygroup = {
        id: `keygroup_${i}`,
        lowNote,
        highNote,
        rootNote: sample.midiNote,
        velocityLayers: [
          {
            id: `velocity_${i}_0`,
            lowVelocity: 0,
            highVelocity: 127,
            sampleId: sample.id,
          },
        ],
      }

      instrument.keygroups.push(keygroup)
      assignedCount++
    }

    return assignedCount
  }

  public async exportInstrument(instrumentId: string, options: InstrumentExportOptions): Promise<Blob> {
    const instrument = this.instruments.get(instrumentId)
    if (!instrument) {
      throw new Error(`Instrument with ID ${instrumentId} not found`)
    }

    let xpmContent: string

    if (options.useMultiLayerExport) {
      // Use the multi-layer exporter for more advanced XPM generation
      const exporter = new MultiLayerExporter(options.name)

      // Collect all sample IDs from the instrument
      const sampleIds: string[] = []
      for (const keygroup of instrument.keygroups) {
        for (const layer of keygroup.velocityLayers) {
          if (layer.sampleId) {
            sampleIds.push(layer.sampleId)
          }
        }
      }

      xpmContent = await exporter.processAndExport(sampleIds)
    } else {
      // Use the standard XPM writer
      const writer = new XPMWriter(options.name)
      xpmContent = writer.createXPM(instrument)
    }

    // If requested, validate and fix the XPM
    if (options.fixXPM) {
      // In a real implementation, this would call the backend
      // For now, we'll just validate the instrument
      const validationReport = await validateInstrument(instrumentId)

      if (validationReport.status === "invalid") {
        console.warn("Instrument validation issues:", validationReport.issues)
      }
    }

    // Create a blob with the XPM content
    return new Blob([xpmContent], { type: "text/plain" })
  }

  public async generatePreview(instrumentId: string): Promise<AudioBuffer | null> {
    const instrument = this.instruments.get(instrumentId)
    if (!instrument) return null

    // Create a silent buffer
    const audioContext = this.audioContext.getContext()
    if (!audioContext) return null

    const duration = 4 // 4 seconds
    const previewBuffer = audioContext.createBuffer(
      2, // stereo
      audioContext.sampleRate * duration,
      audioContext.sampleRate,
    )

    // Find all valid samples in the instrument
    const validSamples: { sampleId: string; note: number }[] = []

    for (const keygroup of instrument.keygroups) {
      for (const layer of keygroup.velocityLayers) {
        if (layer.sampleId) {
          validSamples.push({
            sampleId: layer.sampleId,
            note: keygroup.rootNote,
          })
        }
      }
    }

    if (validSamples.length === 0) return previewBuffer

    // Sort by note
    validSamples.sort((a, b) => a.note - b.note)

    // Play a simple arpeggio with the samples
    const interval = duration / Math.min(8, validSamples.length)
    let offset = 0

    for (let i = 0; i < Math.min(8, validSamples.length); i++) {
      const { sampleId } = validSamples[i]
      const sample = this.sampleManager.getSample(sampleId)
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

  public addKeygroup(instrumentId: string, lowNote: number, highNote: number, rootNote: number): string | null {
    const instrument = this.instruments.get(instrumentId)
    if (!instrument) return null

    const keygroupId = `keygroup_${Date.now()}`

    const keygroup: Keygroup = {
      id: keygroupId,
      lowNote,
      highNote,
      rootNote,
      velocityLayers: [
        {
          id: `velocity_${Date.now()}`,
          lowVelocity: 0,
          highVelocity: 127,
          sampleId: null,
        },
      ],
    }

    instrument.keygroups.push(keygroup)
    return keygroupId
  }

  public addVelocityLayer(
    instrumentId: string,
    keygroupId: string,
    lowVelocity: number,
    highVelocity: number,
  ): string | null {
    const instrument = this.instruments.get(instrumentId)
    if (!instrument) return null

    const keygroup = instrument.keygroups.find((kg) => kg.id === keygroupId)
    if (!keygroup) return null

    const layerId = `velocity_${Date.now()}`

    const velocityLayer: VelocityLayer = {
      id: layerId,
      lowVelocity,
      highVelocity,
      sampleId: null,
    }

    keygroup.velocityLayers.push(velocityLayer)
    return layerId
  }

  public async validateInstrument(instrumentId: string) {
    return validateInstrument(instrumentId)
  }
}

export default InstrumentService

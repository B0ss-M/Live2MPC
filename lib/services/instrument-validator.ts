import { detectPitch } from "./pitch-detection"
import SampleManager from "../sample-manager"

export interface ValidationReport {
  status: "valid" | "invalid"
  issues: string[]
  samplesValidated: number
}

export interface Layer {
  sample: string
  rootKey?: number
  lowKey?: number
  highKey?: number
  lowVelocity?: number
  highVelocity?: number
}

export interface VelocityCheckResult {
  valid: boolean
  issues: string[]
}

export async function validateInstrument(instrumentId: string): Promise<ValidationReport> {
  const sampleManager = SampleManager.getInstance()

  const report: ValidationReport = {
    status: "valid",
    issues: [],
    samplesValidated: 0,
  }

  // Get all samples used in the instrument
  const samples = sampleManager.getAllSamples()
  if (samples.length === 0) {
    report.status = "invalid"
    report.issues.push("No samples found in instrument.")
    return report
  }

  // Create layers from samples
  const layers: Layer[] = []
  for (const sample of samples) {
    if (!sample.buffer) {
      report.status = "invalid"
      report.issues.push(`Sample ${sample.name} has no audio data.`)
      continue
    }

    // Check if we can detect pitch
    try {
      const pitchInfo = await detectPitch(sample.buffer)
      const layer: Layer = {
        sample: sample.name,
      }

      if (pitchInfo) {
        layer.rootKey = pitchInfo.midiNote
      } else {
        // Try to extract pitch from filename
        const extractedPitch = extractPitchFromFilename(sample.name)
        if (extractedPitch) {
          layer.rootKey = extractedPitch
        } else {
          report.issues.push(`Pitch not detected in: ${sample.name}`)
        }
      }

      layers.push(layer)
      report.samplesValidated++
    } catch (error) {
      report.status = "invalid"
      report.issues.push(`Error analyzing sample ${sample.name}: ${error}`)
    }
  }

  // Check velocity layers
  const velocityCheck = parseVelocityLayers(layers)
  if (!velocityCheck.valid) {
    report.status = "invalid"
    report.issues.push(...velocityCheck.issues)
  }

  return report
}

function extractPitchFromFilename(filename: string): number | null {
  // Try to find note name in the file (e.g., Kick_C3.wav)
  const match = /([A-Ga-g][#b]?[0-9])/.exec(filename)
  if (match) {
    return noteToMidi(match[1].toUpperCase())
  }
  return null
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

function parseVelocityLayers(layers: Layer[]): VelocityCheckResult {
  const result: VelocityCheckResult = {
    valid: true,
    issues: [],
  }

  // Group layers by root key
  const layersByRoot: { [key: number]: Layer[] } = {}

  for (const layer of layers) {
    if (layer.rootKey === undefined) continue

    if (!layersByRoot[layer.rootKey]) {
      layersByRoot[layer.rootKey] = []
    }

    layersByRoot[layer.rootKey].push(layer)
  }

  // Check each group for velocity layer issues
  for (const rootKey in layersByRoot) {
    const rootLayers = layersByRoot[rootKey]

    // If there's more than one sample per root key, check velocity ranges
    if (rootLayers.length > 1) {
      // Check for missing velocity ranges
      const missingVelocity = rootLayers.some(
        (layer) => layer.lowVelocity === undefined || layer.highVelocity === undefined,
      )

      if (missingVelocity) {
        result.valid = false
        result.issues.push(`Missing velocity range for some layers with root key ${rootKey}`)
      }

      // Check for overlapping velocity ranges
      for (let i = 0; i < rootLayers.length; i++) {
        for (let j = i + 1; j < rootLayers.length; j++) {
          const layerA = rootLayers[i]
          const layerB = rootLayers[j]

          if (
            layerA.lowVelocity === undefined ||
            layerA.highVelocity === undefined ||
            layerB.lowVelocity === undefined ||
            layerB.highVelocity === undefined
          ) {
            continue
          }

          if (layerA.lowVelocity <= layerB.highVelocity && layerB.lowVelocity <= layerA.highVelocity) {
            result.valid = false
            result.issues.push(`Overlapping velocity ranges for root key ${rootKey}`)
            break
          }
        }
      }
    }
  }

  return result
}

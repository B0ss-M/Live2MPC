import type { Sample } from "../sample-manager"
import SampleManager from "../sample-manager"
import { SampleEditor } from "./sample-editor"

export interface BatchProcessingOptions {
  normalize?: boolean
  trimSilence?: boolean
  fade?: {
    fadeIn: number
    fadeOut: number
  }
  silenceThreshold?: number
}

export interface BatchProcessingResult {
  processed: Sample[]
  failed: { sample: Sample; error: string }[]
}

export class BatchProcessor {
  private sampleManager: SampleManager

  constructor() {
    this.sampleManager = SampleManager.getInstance()
  }

  /**
   * Processes multiple samples in batch
   */
  public async processSamples(samples: Sample[], options: BatchProcessingOptions): Promise<BatchProcessingResult> {
    const result: BatchProcessingResult = {
      processed: [],
      failed: [],
    }

    for (const sample of samples) {
      try {
        // Skip samples without audio data
        if (!sample.buffer) {
          result.failed.push({ sample, error: "No audio data" })
          continue
        }

        // Create a sample editor for this sample
        const editor = new SampleEditor(sample.id)

        // Apply processing based on options
        if (options.normalize) {
          await editor.normalize()
        }

        if (options.trimSilence) {
          await editor.trimSilence(options.silenceThreshold || 0.01)
        }

        if (options.fade) {
          await editor.fade(options.fade.fadeIn, options.fade.fadeOut)
        }

        // Save the processed sample
        const processedSample = await editor.save()

        result.processed.push(processedSample)
      } catch (error) {
        console.error(`Error processing sample ${sample.name}:`, error)
        result.failed.push({ sample, error: String(error) })
      }
    }

    return result
  }

  /**
   * Normalizes multiple samples to a consistent level
   */
  public async normalizeBatch(samples: Sample[], targetLevel = 0.95): Promise<BatchProcessingResult> {
    const result: BatchProcessingResult = {
      processed: [],
      failed: [],
    }

    // First, analyze all samples to find the maximum peak
    let maxPeak = 0
    const samplePeaks = new Map<string, number>()

    for (const sample of samples) {
      if (!sample.buffer) {
        result.failed.push({ sample, error: "No audio data" })
        continue
      }

      try {
        // Find the peak amplitude
        const peak = this.findPeakAmplitude(sample.buffer)
        samplePeaks.set(sample.id, peak)

        if (peak > maxPeak) {
          maxPeak = peak
        }
      } catch (error) {
        console.error(`Error analyzing sample ${sample.name}:`, error)
        result.failed.push({ sample, error: String(error) })
      }
    }

    // Calculate the normalization factor
    const normalizationFactor = targetLevel / maxPeak

    // Apply normalization to each sample
    for (const sample of samples) {
      if (!sample.buffer || !samplePeaks.has(sample.id)) {
        continue
      }

      try {
        // Create a sample editor for this sample
        const editor = new SampleEditor(sample.id)

        // Calculate the individual normalization factor
        const peak = samplePeaks.get(sample.id) || 0
        const individualFactor = (peak * normalizationFactor) / peak

        // Apply normalization
        await editor.normalize()

        // Save the processed sample
        const processedSample = await editor.save()

        result.processed.push(processedSample)
      } catch (error) {
        console.error(`Error normalizing sample ${sample.name}:`, error)
        result.failed.push({ sample, error: String(error) })
      }
    }

    return result
  }

  /**
   * Finds the peak amplitude in an audio buffer
   */
  private findPeakAmplitude(buffer: AudioBuffer): number {
    let peak = 0

    // Check all channels
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i])
        if (abs > peak) {
          peak = abs
        }
      }
    }

    return peak
  }

  /**
   * Applies auto-loop detection to multiple samples
   */
  public async detectLoopPointsBatch(samples: Sample[]): Promise<Map<string, { start: number; end: number } | null>> {
    const loopPoints = new Map<string, { start: number; end: number } | null>()

    for (const sample of samples) {
      try {
        if (!sample.buffer) {
          loopPoints.set(sample.id, null)
          continue
        }

        // Create a sample editor for this sample
        const editor = new SampleEditor(sample.id)

        // Detect loop points
        const points = await editor.detectLoopPoints()

        loopPoints.set(sample.id, points)
      } catch (error) {
        console.error(`Error detecting loop points for sample ${sample.name}:`, error)
        loopPoints.set(sample.id, null)
      }
    }

    return loopPoints
  }
}

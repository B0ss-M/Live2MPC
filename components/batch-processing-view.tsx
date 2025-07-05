"use client"

import { useState, useEffect } from "react"
import SampleManager, { type Sample } from "@/lib/sample-manager"
import { BatchProcessor, type BatchProcessingOptions, type BatchProcessingResult } from "@/lib/services/batch-processor"
import { SampleScanner } from "@/lib/services/sample-scanner"

export default function BatchProcessingView() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSamples, setSelectedSamples] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [processingResult, setProcessingResult] = useState<BatchProcessingResult | null>(null)
  const [options, setOptions] = useState<BatchProcessingOptions>({
    normalize: true,
    trimSilence: false,
    fade: {
      fadeIn: 10,
      fadeOut: 10,
    },
    silenceThreshold: 0.01,
  })
  const [showFolderPicker, setShowFolderPicker] = useState<boolean>(false)

  useEffect(() => {
    const sampleManager = SampleManager.getInstance()
    setSamples(sampleManager.getAllSamples())
  }, [])

  const handleSampleSelect = (sampleId: string) => {
    setSelectedSamples((prev) => {
      if (prev.includes(sampleId)) {
        return prev.filter((id) => id !== sampleId)
      } else {
        return [...prev, sampleId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedSamples.length === samples.length) {
      setSelectedSamples([])
    } else {
      setSelectedSamples(samples.map((sample) => sample.id))
    }
  }

  const handleProcessSamples = async () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select samples first")
      return
    }

    setIsProcessing(true)
    setMessage("Processing samples...")

    try {
      // Get selected samples
      const sampleManager = SampleManager.getInstance()
      const selectedSampleObjects = selectedSamples
        .map((id) => sampleManager.getSample(id))
        .filter((sample): sample is Sample => !!sample)

      // Create batch processor
      const processor = new BatchProcessor()

      // Process samples
      const result = await processor.processSamples(selectedSampleObjects, options)
      setProcessingResult(result)

      setMessage(`Processing complete: ${result.processed.length} processed, ${result.failed.length} failed`)
    } catch (error) {
      console.error("Failed to process samples:", error)
      setMessage("Failed to process samples")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNormalizeBatch = async () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select samples first")
      return
    }

    setIsProcessing(true)
    setMessage("Normalizing samples...")

    try {
      // Get selected samples
      const sampleManager = SampleManager.getInstance()
      const selectedSampleObjects = selectedSamples
        .map((id) => sampleManager.getSample(id))
        .filter((sample): sample is Sample => !!sample)

      // Create batch processor
      const processor = new BatchProcessor()

      // Normalize samples
      const result = await processor.normalizeBatch(selectedSampleObjects, 0.95)
      setProcessingResult(result)

      setMessage(`Normalization complete: ${result.processed.length} processed, ${result.failed.length} failed`)
    } catch (error) {
      console.error("Failed to normalize samples:", error)
      setMessage("Failed to normalize samples")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDetectLoopPoints = async () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select samples first")
      return
    }

    setIsProcessing(true)
    setMessage("Detecting loop points...")

    try {
      // Get selected samples
      const sampleManager = SampleManager.getInstance()
      const selectedSampleObjects = selectedSamples
        .map((id) => sampleManager.getSample(id))
        .filter((sample): sample is Sample => !!sample)

      // Create batch processor
      const processor = new BatchProcessor()

      // Detect loop points
      const loopPoints = await processor.detectLoopPointsBatch(selectedSampleObjects)

      // Count successful detections
      let successCount = 0
      loopPoints.forEach((points) => {
        if (points !== null) {
          successCount++
        }
      })

      setMessage(
        `Loop point detection complete: ${successCount} successful, ${selectedSampleObjects.length - successCount} failed`,
      )
    } catch (error) {
      console.error("Failed to detect loop points:", error)
      setMessage("Failed to detect loop points")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScanFolder = async () => {
    try {
      // Request a directory from the user
      const directoryHandle = await window.showDirectoryPicker({
        mode: "read",
      })

      setIsProcessing(true)
      setMessage("Scanning folder for samples...")

      // Create sample scanner
      const scanner = new SampleScanner()

      // Scan the directory
      const result = await scanner.scanDirectory(directoryHandle, {
        recursive: true,
        includeSubfolders: true,
      })

      setMessage(
        `Scan complete: ${result.loadedFiles} samples loaded, ${result.skippedFiles} skipped, ${result.errors.length} errors`,
      )

      // Update samples list
      const sampleManager = SampleManager.getInstance()
      setSamples(sampleManager.getAllSamples())
    } catch (error) {
      console.error("Failed to scan folder:", error)
      setMessage("Failed to scan folder")
    } finally {
      setIsProcessing(false)
      setShowFolderPicker(false)
    }
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">BATCH PROCESSING</div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-800 p-2 rounded mb-4">
          <div className="text-white text-xs mb-2">Processing Options</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={options.normalize}
                  onChange={(e) => setOptions({ ...options, normalize: e.target.checked })}
                  disabled={isProcessing}
                />
                <span className="text-white text-xs">Normalize</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={options.trimSilence}
                  onChange={(e) => setOptions({ ...options, trimSilence: e.target.checked })}
                  disabled={isProcessing}
                />
                <span className="text-white text-xs">Trim Silence</span>
              </label>
              {options.trimSilence && (
                <div className="flex items-center space-x-1">
                  <span className="text-white text-xs">Threshold:</span>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={options.silenceThreshold}
                    onChange={(e) => setOptions({ ...options, silenceThreshold: Number(e.target.value) })}
                    className="w-24"
                    disabled={isProcessing}
                  />
                  <span className="text-white text-xs w-10">{options.silenceThreshold?.toFixed(3)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={!!options.fade}
                  onChange={(e) =>
                    setOptions({ ...options, fade: e.target.checked ? { fadeIn: 10, fadeOut: 10 } : undefined })
                  }
                  disabled={isProcessing}
                />
                <span className="text-white text-xs">Apply Fade</span>
              </label>
              {options.fade && (
                <div className="flex items-center space-x-1">
                  <span className="text-white text-xs">In:</span>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={options.fade.fadeIn}
                    onChange={(e) =>
                      setOptions({ ...options, fade: { ...options.fade!, fadeIn: Number(e.target.value) } })
                    }
                    className="w-12 bg-gray-900 text-white text-xs p-1 rounded"
                    disabled={isProcessing}
                  />
                  <span className="text-white text-xs">Out:</span>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={options.fade.fadeOut}
                    onChange={(e) =>
                      setOptions({ ...options, fade: { ...options.fade!, fadeOut: Number(e.target.value) } })
                    }
                    className="w-12 bg-gray-900 text-white text-xs p-1 rounded"
                    disabled={isProcessing}
                  />
                  <span className="text-white text-xs">ms</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-2 rounded mb-4">
          <div className="text-white text-xs mb-2">Actions</div>
          <div className="flex space-x-2">
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
              onClick={handleProcessSamples}
              disabled={isProcessing || selectedSamples.length === 0}
            >
              Process Selected
            </button>
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
              onClick={handleNormalizeBatch}
              disabled={isProcessing || selectedSamples.length === 0}
            >
              Normalize Batch
            </button>
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
              onClick={handleDetectLoopPoints}
              disabled={isProcessing || selectedSamples.length === 0}
            >
              Detect Loop Points
            </button>
          </div>
          <div className="mt-2">
            <button
              className="bg-blue-700 text-white py-1 px-3 text-xs hover:bg-blue-600 rounded w-full"
              onClick={handleScanFolder}
              disabled={isProcessing}
            >
              Scan Folder for Samples
            </button>
          </div>
        </div>

        {processingResult && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">Processing Results</div>
            <div className="text-green-400 text-xs">Successfully processed: {processingResult.processed.length}</div>
            {processingResult.failed.length > 0 && (
              <div>
                <div className="text-red-400 text-xs mt-1">Failed: {processingResult.failed.length}</div>
                <div className="max-h-20 overflow-y-auto mt-1">
                  {processingResult.failed.map((failure, index) => (
                    <div key={index} className="text-gray-400 text-xs">
                      {failure.sample.name}: {failure.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-800 p-2 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="text-white text-xs">Select Samples</div>
            <button
              className="bg-gray-700 text-white py-0.5 px-2 text-xs hover:bg-gray-600 rounded"
              onClick={handleSelectAll}
              disabled={isProcessing || samples.length === 0}
            >
              {selectedSamples.length === samples.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {samples.length === 0 ? (
            <div className="text-gray-400 text-xs text-center py-4">
              No samples loaded. Drag and drop audio files to add samples.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className={`p-1 cursor-pointer rounded flex items-center space-x-2 ${
                    selectedSamples.includes(sample.id) ? "bg-gray-700" : "hover:bg-gray-700"
                  }`}
                  onClick={() => handleSampleSelect(sample.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedSamples.includes(sample.id)}
                    onChange={() => {}} // Handled by the div click
                    disabled={isProcessing}
                  />
                  <div className="text-white text-xs truncate">{sample.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs text-gray-400">{message}</div>
      </div>
    </div>
  )
}

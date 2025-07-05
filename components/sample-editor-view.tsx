"use client"

import { useState, useEffect } from "react"
import { SampleEditor } from "@/lib/services/sample-editor"
import SampleManager, { type Sample } from "@/lib/sample-manager"

interface SampleEditorViewProps {
  sampleId: string | null
  onClose: () => void
  onSave: (sample: Sample) => void
}

export default function SampleEditorView({ sampleId, onClose, onSave }: SampleEditorViewProps) {
  const [sample, setSample] = useState<Sample | null>(null)
  const [editor, setEditor] = useState<SampleEditor | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fadeInMs, setFadeInMs] = useState<number>(10)
  const [fadeOutMs, setFadeOutMs] = useState<number>(10)
  const [silenceThreshold, setSilenceThreshold] = useState<number>(0.01)

  useEffect(() => {
    if (!sampleId) return

    const sampleManager = SampleManager.getInstance()
    const loadedSample = sampleManager.getSample(sampleId)

    if (loadedSample) {
      setSample(loadedSample)
      setWaveformData(loadedSample.waveform)

      try {
        const sampleEditor = new SampleEditor(sampleId)
        setEditor(sampleEditor)
      } catch (error) {
        console.error("Failed to create sample editor:", error)
        setMessage("Failed to load sample for editing")
      }
    }
  }, [sampleId])

  const handleNormalize = async () => {
    if (!editor) return

    setIsProcessing(true)
    setMessage("Normalizing sample...")

    try {
      await editor.normalize()
      setMessage("Sample normalized")

      // Update waveform preview
      const updatedSample = await editor.save()
      setSample(updatedSample)
      setWaveformData(updatedSample.waveform)
    } catch (error) {
      console.error("Failed to normalize sample:", error)
      setMessage("Failed to normalize sample")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTrimSilence = async () => {
    if (!editor) return

    setIsProcessing(true)
    setMessage("Trimming silence...")

    try {
      await editor.trimSilence(silenceThreshold)
      setMessage("Silence trimmed")

      // Update waveform preview
      const updatedSample = await editor.save()
      setSample(updatedSample)
      setWaveformData(updatedSample.waveform)
    } catch (error) {
      console.error("Failed to trim silence:", error)
      setMessage("Failed to trim silence")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFade = async () => {
    if (!editor) return

    setIsProcessing(true)
    setMessage("Applying fade...")

    try {
      await editor.fade(fadeInMs, fadeOutMs)
      setMessage("Fade applied")

      // Update waveform preview
      const updatedSample = await editor.save()
      setSample(updatedSample)
      setWaveformData(updatedSample.waveform)
    } catch (error) {
      console.error("Failed to apply fade:", error)
      setMessage("Failed to apply fade")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDetectLoopPoints = async () => {
    if (!editor) return

    setIsProcessing(true)
    setMessage("Detecting loop points...")

    try {
      const loopPoints = await editor.detectLoopPoints()

      if (loopPoints) {
        setMessage(`Loop points detected: ${loopPoints.start} - ${loopPoints.end}`)
      } else {
        setMessage("Could not detect suitable loop points")
      }
    } catch (error) {
      console.error("Failed to detect loop points:", error)
      setMessage("Failed to detect loop points")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = async () => {
    if (!editor || !sample) return

    try {
      const updatedSample = await editor.save()
      onSave(updatedSample)
      setMessage("Sample saved successfully")
    } catch (error) {
      console.error("Failed to save sample:", error)
      setMessage("Failed to save sample")
    }
  }

  if (!sample) {
    return (
      <div className="w-full h-full bg-black rounded-md p-2 flex flex-col items-center justify-center">
        <div className="text-white">No sample selected for editing</div>
        <button className="mt-4 bg-gray-800 text-white py-2 px-4 text-sm hover:bg-gray-700 rounded" onClick={onClose}>
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2 flex justify-between items-center">
        <div>SAMPLE EDITOR: {sample.name}</div>
        <button
          className="bg-gray-800 text-white py-1 px-3 text-xs hover:bg-gray-700 rounded"
          onClick={onClose}
          disabled={isProcessing}
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Waveform display */}
        <div className="bg-gray-900 p-2 rounded mb-4">
          <div className="h-24 w-full flex items-center justify-center">
            {waveformData.length > 0 ? (
              <div className="w-full flex items-center">
                {waveformData.map((value, index) => (
                  <div key={index} className="w-1 mx-[1px] bg-blue-400" style={{ height: `${value * 100}%` }}></div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400">No waveform data available</div>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Duration: {sample.duration.toFixed(2)}s | Sample Rate: {sample.buffer?.sampleRate || "Unknown"}
          </div>
        </div>

        {/* Editing controls */}
        <div className="space-y-4">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-white text-xs mb-2">Basic Processing</div>
            <div className="flex space-x-2">
              <button
                className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
                onClick={handleNormalize}
                disabled={isProcessing}
              >
                Normalize
              </button>
              <button
                className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
                onClick={handleTrimSilence}
                disabled={isProcessing}
              >
                Trim Silence
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-2 rounded">
            <div className="text-white text-xs mb-2">Fade Settings</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-white text-xs w-16">Fade In (ms):</span>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={fadeInMs}
                  onChange={(e) => setFadeInMs(Number(e.target.value))}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <span className="text-white text-xs w-8">{fadeInMs}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white text-xs w-16">Fade Out (ms):</span>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={fadeOutMs}
                  onChange={(e) => setFadeOutMs(Number(e.target.value))}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <span className="text-white text-xs w-8">{fadeOutMs}</span>
              </div>
              <button
                className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded w-full"
                onClick={handleFade}
                disabled={isProcessing}
              >
                Apply Fade
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-2 rounded">
            <div className="text-white text-xs mb-2">Silence Threshold</div>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs w-16">Threshold:</span>
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={silenceThreshold}
                onChange={(e) => setSilenceThreshold(Number(e.target.value))}
                className="flex-1"
                disabled={isProcessing}
              />
              <span className="text-white text-xs w-12">{silenceThreshold.toFixed(3)}</span>
            </div>
          </div>

          <div className="bg-gray-800 p-2 rounded">
            <div className="text-white text-xs mb-2">Loop Points</div>
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded w-full"
              onClick={handleDetectLoopPoints}
              disabled={isProcessing}
            >
              Detect Loop Points
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs text-gray-400">{isProcessing ? "Processing..." : message}</div>
        <button
          className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded"
          onClick={handleSave}
          disabled={isProcessing}
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

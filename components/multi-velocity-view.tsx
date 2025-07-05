"use client"

import { useState, useEffect } from "react"
import SampleManager, { type Sample } from "@/lib/sample-manager"
import { VelocityLayerManager } from "@/lib/services/velocity-layer-manager"
import { XPMUtils } from "@/lib/services/xpm-utils"

export default function MultiVelocityView() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSamples, setSelectedSamples] = useState<string[]>([])
  const [presetName, setPresetName] = useState<string>("Multi-Velocity Instrument")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [velocityLayers, setVelocityLayers] = useState<Map<number, Sample[]>>(new Map())
  const [detectVelocity, setDetectVelocity] = useState<boolean>(true)
  const [optimizeRanges, setOptimizeRanges] = useState<boolean>(true)

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

  const handleAnalyzeVelocityLayers = () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select samples first")
      return
    }

    setMessage("Analyzing velocity layers...")

    try {
      // Get selected samples
      const sampleManager = SampleManager.getInstance()
      const selectedSampleObjects = selectedSamples
        .map((id) => sampleManager.getSample(id))
        .filter((sample): sample is Sample => !!sample)

      // Create velocity layer manager
      const velocityManager = new VelocityLayerManager()

      // Organize samples into velocity layers
      const layers = velocityManager.organizeVelocityLayers(selectedSampleObjects)

      setVelocityLayers(layers)

      // Count total layers
      let totalLayers = 0
      layers.forEach((samples) => {
        totalLayers += samples.length
      })

      setMessage(`Found ${layers.size} notes with ${totalLayers} velocity layers`)
    } catch (error) {
      console.error("Failed to analyze velocity layers:", error)
      setMessage("Failed to analyze velocity layers")
    }
  }

  const handleGenerateXPM = async () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select samples first")
      return
    }

    setIsGenerating(true)
    setMessage("Generating XPM...")

    try {
      // Get selected samples
      const sampleManager = SampleManager.getInstance()
      const selectedSampleObjects = selectedSamples
        .map((id) => sampleManager.getSample(id))
        .filter((sample): sample is Sample => !!sample)

      // Create XPM utils
      const xpmUtils = new XPMUtils(presetName, "instrument")

      // Generate XPM content
      const xpmContent = await xpmUtils.createXPM(selectedSampleObjects, {
        autoMapSamples: true,
        detectVelocityLayers: detectVelocity,
        optimizeKeyRanges: optimizeRanges,
        validateSamples: true,
      })

      // Create a download link
      const blob = new Blob([xpmContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${presetName}.xpm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage("XPM generated successfully!")
    } catch (error) {
      console.error("Failed to generate XPM:", error)
      setMessage("Failed to generate XPM")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">MULTI-VELOCITY INSTRUMENT</div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-800 p-2 rounded mb-4">
          <div className="text-white text-xs mb-2">Preset Settings</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs w-16">Name:</span>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                disabled={isGenerating}
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={detectVelocity}
                  onChange={(e) => setDetectVelocity(e.target.checked)}
                  disabled={isGenerating}
                />
                <span className="text-white text-xs">Detect Velocity Layers</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={optimizeRanges}
                  onChange={(e) => setOptimizeRanges(e.target.checked)}
                  disabled={isGenerating}
                />
                <span className="text-white text-xs">Optimize Key Ranges</span>
              </label>
            </div>
          </div>
        </div>

        {velocityLayers.size > 0 && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">Detected Velocity Layers</div>
            <div className="max-h-32 overflow-y-auto">
              {Array.from(velocityLayers.entries()).map(([midiNote, samples]) => (
                <div key={midiNote} className="mb-2">
                  <div className="text-white text-xs">
                    Note: {this.getMidiNoteName(midiNote)} (MIDI {midiNote})
                  </div>
                  <div className="pl-4">
                    {samples.map((sample, index) => (
                      <div key={sample.id} className="text-gray-400 text-xs">
                        Layer {index + 1}: {sample.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-800 p-2 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="text-white text-xs">Select Samples</div>
            <button
              className="bg-gray-700 text-white py-0.5 px-2 text-xs hover:bg-gray-600 rounded"
              onClick={handleSelectAll}
              disabled={isGenerating || samples.length === 0}
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
                    disabled={isGenerating}
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
        <div className="flex space-x-2">
          <button
            className="bg-blue-700 text-white py-1 px-3 text-xs hover:bg-blue-600 rounded"
            onClick={handleAnalyzeVelocityLayers}
            disabled={isGenerating || selectedSamples.length === 0}
          >
            Analyze Layers
          </button>
          <button
            className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded"
            onClick={handleGenerateXPM}
            disabled={isGenerating || selectedSamples.length === 0}
          >
            {isGenerating ? "Generating..." : "Generate XPM"}
          </button>
        </div>
      </div>
    </div>
  )

  // Helper method to convert MIDI note to note name
  function getMidiNoteName(midiNote: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Math.floor(midiNote / 12) - 1
    const noteName = noteNames[midiNote % 12]
    return `${noteName}${octave}`
  }
}

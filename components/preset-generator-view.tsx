"use client"

import { useState, useEffect } from "react"
import { PresetGenerator, type PresetOptions } from "@/lib/services/preset-generator"
import { InstrumentScanner, type ScannedInstrument } from "@/lib/services/instrument-scanner"
import SampleManager, { type Sample } from "@/lib/sample-manager"

export default function PresetGeneratorView() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSamples, setSelectedSamples] = useState<string[]>([])
  const [presetName, setPresetName] = useState<string>("My Preset")
  const [presetType, setPresetType] = useState<"drumkit" | "instrument">("drumkit")
  const [includePreview, setIncludePreview] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [scannedInstruments, setScannedInstruments] = useState<ScannedInstrument[]>([])
  const [isScanning, setIsScanning] = useState<boolean>(false)

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

  const handleGeneratePreset = async () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select at least one sample")
      return
    }

    setIsGenerating(true)
    setMessage("Generating preset...")

    try {
      const options: PresetOptions = {
        name: presetName,
        type: presetType,
        includePreview,
      }

      const generator = new PresetGenerator(options)
      const blob = await generator.generatePreset(selectedSamples)

      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${presetName}.xpm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage("Preset generated successfully!")
    } catch (error) {
      console.error("Failed to generate preset:", error)
      setMessage("Failed to generate preset")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleScanForInstruments = async () => {
    setIsScanning(true)
    setMessage("Scanning for instruments...")

    try {
      const scanner = new InstrumentScanner()
      const instruments = await scanner.scanForInstruments()
      setScannedInstruments(instruments)
      setMessage(`Found ${instruments.length} potential instruments`)
    } catch (error) {
      console.error("Failed to scan for instruments:", error)
      setMessage("Failed to scan for instruments")
    } finally {
      setIsScanning(false)
    }
  }

  const handleUseScannedInstrument = (instrument: ScannedInstrument) => {
    setPresetName(instrument.name)
    setPresetType(instrument.type)
    setSelectedSamples(instrument.samples.map((sample) => sample.id))
    setMessage(`Selected ${instrument.samples.length} samples from "${instrument.name}"`)
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2 flex justify-between items-center">
        <div>PRESET GENERATOR</div>
        <button
          className="bg-gray-800 text-white py-1 px-3 text-xs hover:bg-gray-700 rounded"
          onClick={handleScanForInstruments}
          disabled={isScanning || samples.length === 0}
        >
          {isScanning ? "Scanning..." : "Scan for Instruments"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {scannedInstruments.length > 0 && (
          <div className="mb-4">
            <div className="text-white text-xs mb-2">Detected Instruments</div>
            <div className="space-y-2">
              {scannedInstruments.map((instrument) => (
                <div key={instrument.id} className="bg-gray-800 p-2 rounded flex justify-between items-center">
                  <div>
                    <div className="text-white text-sm">{instrument.name}</div>
                    <div className="text-gray-400 text-xs">
                      {instrument.type} | {instrument.samples.length} samples
                    </div>
                  </div>
                  <button
                    className="bg-gray-700 text-white py-1 px-2 text-xs hover:bg-gray-600 rounded"
                    onClick={() => handleUseScannedInstrument(instrument)}
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <span className="text-white text-xs w-16">Type:</span>
              <select
                value={presetType}
                onChange={(e) => setPresetType(e.target.value as "drumkit" | "instrument")}
                className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                disabled={isGenerating}
              >
                <option value="drumkit">Drum Kit</option>
                <option value="instrument">Instrument</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={includePreview}
                  onChange={(e) => setIncludePreview(e.target.checked)}
                  disabled={isGenerating}
                />
                <span className="text-white text-xs">Include Preview</span>
              </label>
            </div>
          </div>
        </div>

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
        <button
          className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded"
          onClick={handleGeneratePreset}
          disabled={isGenerating || selectedSamples.length === 0}
        >
          {isGenerating ? "Generating..." : "Generate Preset"}
        </button>
      </div>
    </div>
  )
}

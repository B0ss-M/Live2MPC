"use client"

import { useState, useEffect } from "react"
import InstrumentService, { type Instrument, type Keygroup } from "@/lib/services/instrument-service"
import SampleManager, { type Sample } from "@/lib/sample-manager"

export default function InstrumentView() {
  const [currentInstrument, setCurrentInstrument] = useState<Instrument | null>(null)
  const [selectedKeygroupId, setSelectedKeygroupId] = useState<string | null>(null)
  const [exportName, setExportName] = useState<string>("My Instrument")
  const [includePreview, setIncludePreview] = useState<boolean>(true)
  const [fixXPM, setFixXPM] = useState<boolean>(true)
  const [useMultiLayerExport, setUseMultiLayerExport] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showAddKeygroup, setShowAddKeygroup] = useState<boolean>(false)
  const [showAddVelocityLayer, setShowAddVelocityLayer] = useState<boolean>(false)
  const [newKeygroupLow, setNewKeygroupLow] = useState<number>(0)
  const [newKeygroupHigh, setNewKeygroupHigh] = useState<number>(127)
  const [newKeygroupRoot, setNewKeygroupRoot] = useState<number>(60)
  const [newVelocityLow, setNewVelocityLow] = useState<number>(0)
  const [newVelocityHigh, setNewVelocityHigh] = useState<number>(127)
  const [validationResult, setValidationResult] = useState<{ status: string; issues: string[] } | null>(null)

  useEffect(() => {
    const instrumentService = InstrumentService.getInstance()
    setCurrentInstrument(instrumentService.getCurrentInstrument())
  }, [])

  const handleExport = async () => {
    if (!currentInstrument) return

    try {
      setMessage("Exporting instrument...")
      const instrumentService = InstrumentService.getInstance()

      const blob = await instrumentService.exportInstrument(currentInstrument.id, {
        name: exportName,
        includePreview,
        fixXPM,
        useMultiLayerExport,
      })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${exportName}.xpm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage("Instrument exported successfully!")

      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to export instrument:", error)
      setMessage("Failed to export instrument")

      // Clear error message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleAutoMap = async () => {
    if (!currentInstrument) return

    try {
      setMessage("Auto-mapping samples...")
      const instrumentService = InstrumentService.getInstance()
      const sampleManager = SampleManager.getInstance()

      // Get all loaded samples
      const samples = sampleManager.getAllSamples()
      const sampleIds = samples.map((sample) => sample.id)

      // Auto-map samples to keygroups
      const mappedCount = await instrumentService.autoMapSamples(currentInstrument.id, sampleIds)

      setMessage(`Auto-mapped ${mappedCount} samples to keygroups`)

      // Refresh current instrument
      setCurrentInstrument(instrumentService.getCurrentInstrument())

      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to auto-map samples:", error)
      setMessage("Failed to auto-map samples")

      // Clear error message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleKeygroupSelect = (keygroupId: string) => {
    setSelectedKeygroupId(keygroupId === selectedKeygroupId ? null : keygroupId)
    setShowAddVelocityLayer(false)
  }

  const handleAddKeygroup = () => {
    if (!currentInstrument) return

    const instrumentService = InstrumentService.getInstance()
    const keygroupId = instrumentService.addKeygroup(
      currentInstrument.id,
      newKeygroupLow,
      newKeygroupHigh,
      newKeygroupRoot,
    )

    if (keygroupId) {
      setMessage("Keygroup added successfully")
      setCurrentInstrument(instrumentService.getCurrentInstrument())
      setShowAddKeygroup(false)

      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleAddVelocityLayer = () => {
    if (!currentInstrument || !selectedKeygroupId) return

    const instrumentService = InstrumentService.getInstance()
    const layerId = instrumentService.addVelocityLayer(
      currentInstrument.id,
      selectedKeygroupId,
      newVelocityLow,
      newVelocityHigh,
    )

    if (layerId) {
      setMessage("Velocity layer added successfully")
      setCurrentInstrument(instrumentService.getCurrentInstrument())
      setShowAddVelocityLayer(false)

      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleValidate = async () => {
    if (!currentInstrument) return

    try {
      setMessage("Validating instrument...")
      const instrumentService = InstrumentService.getInstance()

      const result = await instrumentService.validateInstrument(currentInstrument.id)
      setValidationResult(result)

      setMessage(`Validation complete: ${result.status}`)

      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to validate instrument:", error)
      setMessage("Failed to validate instrument")

      // Clear error message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const getSampleForKeygroup = (keygroup: Keygroup): Sample | null => {
    if (!keygroup.velocityLayers.length || !keygroup.velocityLayers[0].sampleId) return null

    const sampleManager = SampleManager.getInstance()
    return sampleManager.getSample(keygroup.velocityLayers[0].sampleId) || null
  }

  const getNoteNameFromMidi = (midiNote: number): string => {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Math.floor(midiNote / 12) - 1
    const noteName = noteNames[midiNote % 12]
    return `${noteName}${octave}`
  }

  if (!currentInstrument) {
    return (
      <div className="w-full h-full bg-black rounded-md p-2 flex flex-col items-center justify-center">
        <div className="text-white">Loading instrument...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2 flex justify-between items-center">
        <div>INSTRUMENT EDITOR</div>
        <div className="flex space-x-2">
          <button
            className="bg-gray-800 text-white py-1 px-2 text-xs hover:bg-gray-700 rounded"
            onClick={() => setShowAddKeygroup(!showAddKeygroup)}
          >
            {showAddKeygroup ? "Cancel" : "Add Keygroup"}
          </button>
          <button
            className="bg-gray-800 text-white py-1 px-2 text-xs hover:bg-gray-700 rounded"
            onClick={handleValidate}
          >
            Validate
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showAddKeygroup ? (
          <div className="bg-gray-800 p-2 rounded mb-2">
            <div className="text-white text-xs mb-2">Add New Keygroup</div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-white text-xs w-16">Low Note:</span>
                <input
                  type="number"
                  min="0"
                  max="127"
                  value={newKeygroupLow}
                  onChange={(e) => setNewKeygroupLow(Number(e.target.value))}
                  className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                />
                <span className="text-gray-400 text-xs">{getNoteNameFromMidi(newKeygroupLow)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-white text-xs w-16">High Note:</span>
                <input
                  type="number"
                  min="0"
                  max="127"
                  value={newKeygroupHigh}
                  onChange={(e) => setNewKeygroupHigh(Number(e.target.value))}
                  className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                />
                <span className="text-gray-400 text-xs">{getNoteNameFromMidi(newKeygroupHigh)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-white text-xs w-16">Root Note:</span>
                <input
                  type="number"
                  min="0"
                  max="127"
                  value={newKeygroupRoot}
                  onChange={(e) => setNewKeygroupRoot(Number(e.target.value))}
                  className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                />
                <span className="text-gray-400 text-xs">{getNoteNameFromMidi(newKeygroupRoot)}</span>
              </div>

              <div className="flex justify-end">
                <button
                  className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded"
                  onClick={handleAddKeygroup}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : showAddVelocityLayer && selectedKeygroupId ? (
          <div className="bg-gray-800 p-2 rounded mb-2">
            <div className="text-white text-xs mb-2">Add Velocity Layer</div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-white text-xs w-16">Low Velocity:</span>
                <input
                  type="number"
                  min="0"
                  max="127"
                  value={newVelocityLow}
                  onChange={(e) => setNewVelocityLow(Number(e.target.value))}
                  className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-white text-xs w-16">High Velocity:</span>
                <input
                  type="number"
                  min="0"
                  max="127"
                  value={newVelocityHigh}
                  onChange={(e) => setNewVelocityHigh(Number(e.target.value))}
                  className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                />
              </div>

              <div className="flex justify-end">
                <button
                  className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded"
                  onClick={handleAddVelocityLayer}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : validationResult ? (
          <div className={`bg-${validationResult.status === "valid" ? "green" : "red"}-900 p-2 rounded mb-2`}>
            <div className="text-white text-xs mb-2">Validation Result: {validationResult.status.toUpperCase()}</div>

            {validationResult.issues.length > 0 ? (
              <div className="space-y-1">
                <div className="text-white text-xs">Issues:</div>
                <ul className="list-disc list-inside text-xs text-gray-300">
                  {validationResult.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-green-300 text-xs">No issues found!</div>
            )}

            <div className="flex justify-end mt-2">
              <button
                className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded"
                onClick={() => setValidationResult(null)}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {currentInstrument.keygroups.map((keygroup) => {
              const sample = getSampleForKeygroup(keygroup)
              return (
                <div
                  key={keygroup.id}
                  className={`p-2 rounded cursor-pointer ${keygroup.id === selectedKeygroupId ? "bg-gray-700" : "bg-gray-800"}`}
                  onClick={() => handleKeygroupSelect(keygroup.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-white text-xs">
                      {getNoteNameFromMidi(keygroup.lowNote)} - {getNoteNameFromMidi(keygroup.highNote)}
                    </div>
                    {sample && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">Root: {getNoteNameFromMidi(keygroup.rootNote)}</div>
                  <div className="text-gray-400 text-xs mt-1 truncate">
                    {sample ? sample.name : "No sample assigned"}
                  </div>

                  {keygroup.id === selectedKeygroupId && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-white text-xs">Velocity Layers</div>
                        <button
                          className="bg-gray-700 text-white py-0.5 px-2 text-xs hover:bg-gray-600 rounded"
                          onClick={() => setShowAddVelocityLayer(!showAddVelocityLayer)}
                        >
                          Add Layer
                        </button>
                      </div>
                      {keygroup.velocityLayers.map((layer) => (
                        <div key={layer.id} className="text-gray-400 text-xs flex justify-between">
                          <span>
                            {layer.lowVelocity}-{layer.highVelocity}
                          </span>
                          <span>{layer.sampleId ? "Assigned" : "Empty"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-white text-xs">Export Settings</div>
          <button
            className="bg-gray-800 text-white py-1 px-3 text-xs hover:bg-gray-700 rounded"
            onClick={handleAutoMap}
          >
            Auto-Map
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-white text-xs">Name:</span>
          <input
            type="text"
            value={exportName}
            onChange={(e) => setExportName(e.target.value)}
            className="flex-1 bg-gray-800 text-white text-xs p-1 rounded"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={includePreview}
              onChange={(e) => setIncludePreview(e.target.checked)}
              className="bg-gray-800"
            />
            <span className="text-white text-xs">Include Preview</span>
          </label>

          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={fixXPM}
              onChange={(e) => setFixXPM(e.target.checked)}
              className="bg-gray-800"
            />
            <span className="text-white text-xs">Fix XPM</span>
          </label>

          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={useMultiLayerExport}
              onChange={(e) => setUseMultiLayerExport(e.target.checked)}
              className="bg-gray-800"
            />
            <span className="text-white text-xs">Multi-Layer</span>
          </label>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">{message && <span>{message}</span>}</div>
          <button
            className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded"
            onClick={handleExport}
          >
            Export Instrument
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import DrumKitService, { type DrumKit, type DrumPad } from "@/lib/services/drumkit-service"
import SampleManager, { type Sample } from "@/lib/sample-manager"

interface DrumKitViewProps {
  selectedPad: number | null
}

export default function DrumKitView({ selectedPad }: DrumKitViewProps) {
  const [currentKit, setCurrentKit] = useState<DrumKit | null>(null)
  const [currentBank, setCurrentBank] = useState<string>("A")
  const [exportName, setExportName] = useState<string>("My Drum Kit")
  const [includePreview, setIncludePreview] = useState<boolean>(true)
  const [fixXPM, setFixXPM] = useState<boolean>(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const drumKitService = DrumKitService.getInstance()
    setCurrentKit(drumKitService.getCurrentKit())
  }, [])

  const handleBankChange = (bank: string) => {
    setCurrentBank(bank)
  }

  const handleExport = async () => {
    if (!currentKit) return

    try {
      setMessage("Exporting drum kit...")
      const drumKitService = DrumKitService.getInstance()

      const blob = await drumKitService.exportKit(currentKit.id, {
        name: exportName,
        includePreview,
        fixXPM,
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

      setMessage("Drum kit exported successfully!")

      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to export drum kit:", error)
      setMessage("Failed to export drum kit")

      // Clear error message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleAutoAssign = async () => {
    if (!currentKit) return

    try {
      setMessage("Auto-assigning samples...")
      const drumKitService = DrumKitService.getInstance()
      const sampleManager = SampleManager.getInstance()

      // Get all loaded samples
      const samples = sampleManager.getAllSamples()
      const sampleIds = samples.map((sample) => sample.id)

      // Auto-assign samples to pads
      const assignedCount = await drumKitService.autoAssignSamples(currentKit.id, sampleIds)

      setMessage(`Auto-assigned ${assignedCount} samples to pads`)

      // Refresh current kit
      setCurrentKit(drumKitService.getCurrentKit())

      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to auto-assign samples:", error)
      setMessage("Failed to auto-assign samples")

      // Clear error message after a few seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const getPadsForCurrentBank = (): DrumPad[] => {
    if (!currentKit) return []
    return currentKit.pads.filter((pad) => pad.bankId === currentBank)
  }

  const getSampleForPad = (pad: DrumPad): Sample | null => {
    if (!pad.sampleId) return null

    const sampleManager = SampleManager.getInstance()
    return sampleManager.getSample(pad.sampleId) || null
  }

  if (!currentKit) {
    return (
      <div className="w-full h-full bg-black rounded-md p-2 flex flex-col items-center justify-center">
        <div className="text-white">Loading drum kit...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2 flex justify-between items-center">
        <div>DRUM KIT EDITOR</div>
        <div className="flex items-center space-x-2">
          <span className="text-xs">Bank:</span>
          <select
            value={currentBank}
            onChange={(e) => handleBankChange(e.target.value)}
            className="bg-gray-800 text-white text-xs p-1 rounded"
          >
            {["A", "B", "C", "D", "E", "F", "G", "H"].map((bank) => (
              <option key={bank} value={bank}>
                Bank {bank}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {getPadsForCurrentBank().map((pad) => {
            const sample = getSampleForPad(pad)
            return (
              <div
                key={pad.id}
                className={`p-2 rounded ${pad.padNumber === selectedPad ? "bg-gray-700" : "bg-gray-800"}`}
              >
                <div className="flex justify-between items-center">
                  <div className="text-white text-xs">{pad.label}</div>
                  {sample && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                </div>
                <div className="text-gray-400 text-xs mt-1 truncate">{sample ? sample.name : "No sample assigned"}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-white text-xs">Export Settings</div>
          <button
            className="bg-gray-800 text-white py-1 px-3 text-xs hover:bg-gray-700 rounded"
            onClick={handleAutoAssign}
          >
            Auto-Assign
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
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">{message && <span>{message}</span>}</div>
          <button
            className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded"
            onClick={handleExport}
          >
            Export Kit
          </button>
        </div>
      </div>
    </div>
  )
}

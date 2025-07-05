"use client"

import type React from "react"

import { useState, useEffect } from "react"
import MIDIController, { type MIDIDeviceInfo } from "@/lib/midi-controller"

export default function MIDISettings() {
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([])
  const [padMappings, setPadMappings] = useState<Map<number, number>>(new Map())
  const [selectedPad, setSelectedPad] = useState<number | null>(null)
  const [midiNote, setMidiNote] = useState<number>(36)

  useEffect(() => {
    // Get MIDI devices
    const midiController = MIDIController.getInstance()
    setDevices(midiController.getAvailableDevices())
    setPadMappings(midiController.getPadMappings())

    // Set up interval to refresh devices
    const intervalId = setInterval(() => {
      setDevices(midiController.getAvailableDevices())
    }, 2000)

    return () => clearInterval(intervalId)
  }, [])

  const handlePadClick = (padId: number) => {
    setSelectedPad(padId)

    // Find MIDI note for this pad
    padMappings.forEach((pad, note) => {
      if (pad === padId) {
        setMidiNote(note)
      }
    })
  }

  const handleMidiNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const note = Number.parseInt(e.target.value, 10)
    setMidiNote(note)

    if (selectedPad !== null) {
      const midiController = MIDIController.getInstance()
      midiController.mapPadToNote(selectedPad, note)

      // Update mappings
      setPadMappings(midiController.getPadMappings())
    }
  }

  const getMidiNoteForPad = (padId: number): number | null => {
    let foundNote = null
    padMappings.forEach((pad, note) => {
      if (pad === padId) {
        foundNote = note
      }
    })
    return foundNote
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">MIDI SETTINGS</div>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-white text-sm mb-2">MIDI Devices</h3>
          {devices.length === 0 ? (
            <div className="text-gray-400 text-xs">No MIDI devices detected. Connect a MIDI device and refresh.</div>
          ) : (
            <div className="space-y-1">
              {devices.map((device) => (
                <div key={device.id} className="bg-gray-800 p-2 rounded text-xs">
                  <div className="text-white">{device.name}</div>
                  <div className="text-gray-400">
                    {device.manufacturer} ({device.type})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-white text-sm mb-2">Pad Mappings</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Array.from({ length: 16 }).map((_, index) => (
              <div
                key={index}
                className={`aspect-square bg-gray-800 rounded flex flex-col items-center justify-center cursor-pointer
                          ${selectedPad === index ? "ring-2 ring-white" : "hover:bg-gray-700"}`}
                onClick={() => handlePadClick(index)}
              >
                <div className="text-white text-xs">Pad {index + 1}</div>
                <div className="text-gray-400 text-xs mt-1">
                  {getMidiNoteForPad(index) !== null ? `Note ${getMidiNoteForPad(index)}` : "Not mapped"}
                </div>
              </div>
            ))}
          </div>

          {selectedPad !== null && (
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-white text-xs mb-2">Mapping for Pad {selectedPad + 1}</div>
              <div className="flex items-center">
                <span className="text-gray-400 text-xs mr-2">MIDI Note:</span>
                <input
                  type="number"
                  min="0"
                  max="127"
                  value={midiNote}
                  onChange={handleMidiNoteChange}
                  className="w-12 bg-gray-900 text-white text-xs p-1 rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

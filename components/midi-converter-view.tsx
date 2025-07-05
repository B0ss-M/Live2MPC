"use client"

import type React from "react"

import { useState, useRef } from "react"
import { MIDIConverter, type MIDIData, type ProgressionData, type MPCPatternData } from "@/lib/services/midi-converter"
import MIDIController from "@/lib/midi-controller"

export default function MIDIConverterView() {
  const [midiFile, setMidiFile] = useState<File | null>(null)
  const [midiData, setMidiData] = useState<MIDIData | null>(null)
  const [progressionData, setProgressionData] = useState<ProgressionData | null>(null)
  const [mpcPatternData, setMPCPatternData] = useState<MPCPatternData | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [usePadMapping, setUsePadMapping] = useState<boolean>(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setMidiFile(file)
      setMessage(`Selected MIDI file: ${file.name}`)

      // Reset data
      setMidiData(null)
      setProgressionData(null)
      setMPCPatternData(null)
    }
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleParseMIDI = async () => {
    if (!midiFile) {
      setMessage("Please select a MIDI file first")
      return
    }

    setIsProcessing(true)
    setMessage("Parsing MIDI file...")

    try {
      const converter = new MIDIConverter()
      const data = await converter.parseMIDIFile(midiFile)
      setMidiData(data)

      setMessage(
        `MIDI file parsed successfully: ${data.tracks.length} tracks, ${data.header.ticksPerBeat} ticks per beat`,
      )
    } catch (error) {
      console.error("Failed to parse MIDI file:", error)
      setMessage(`Failed to parse MIDI file: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConvertToProgression = () => {
    if (!midiData) {
      setMessage("Please parse the MIDI file first")
      return
    }

    try {
      const converter = new MIDIConverter()
      const progression = converter.convertToProgression(midiData)
      setProgressionData(progression)

      setMessage(`Converted to progression format: ${progression.notes.length} notes, BPM: ${progression.meta.bpm}`)
    } catch (error) {
      console.error("Failed to convert to progression:", error)
      setMessage(`Failed to convert to progression: ${error}`)
    }
  }

  const handleConvertToMPCPattern = () => {
    if (!midiData) {
      setMessage("Please parse the MIDI file first")
      return
    }

    try {
      const converter = new MIDIConverter()

      // Get pad mappings if enabled
      let padMapping: Map<number, number> | undefined

      if (usePadMapping) {
        const midiController = MIDIController.getInstance()
        padMapping = midiController.getPadMappings()
      }

      const pattern = converter.convertToMPCPattern(midiData, padMapping)
      setMPCPatternData(pattern)

      setMessage(`Converted to MPC pattern: ${pattern.tracks.length} tracks, ${pattern.bars} bars, BPM: ${pattern.bpm}`)
    } catch (error) {
      console.error("Failed to convert to MPC pattern:", error)
      setMessage(`Failed to convert to MPC pattern: ${error}`)
    }
  }

  const handleSaveProgression = () => {
    if (!progressionData) {
      setMessage("Please convert to progression format first")
      return
    }

    try {
      const converter = new MIDIConverter()
      const filename = midiFile ? midiFile.name.replace(/\.[^/.]+$/, ".progression") : "pattern.progression"

      converter.saveProgressionToFile(progressionData, filename)
      setMessage(`Saved progression file: ${filename}`)
    } catch (error) {
      console.error("Failed to save progression file:", error)
      setMessage(`Failed to save progression file: ${error}`)
    }
  }

  const handleSaveMPCPattern = () => {
    if (!mpcPatternData) {
      setMessage("Please convert to MPC pattern format first")
      return
    }

    try {
      const converter = new MIDIConverter()
      const filename = midiFile ? midiFile.name.replace(/\.[^/.]+$/, ".mpcpattern") : "pattern.mpcpattern"

      converter.saveMPCPatternToFile(mpcPatternData, filename)
      setMessage(`Saved MPC pattern file: ${filename}`)
    } catch (error) {
      console.error("Failed to save MPC pattern file:", error)
      setMessage(`Failed to save MPC pattern file: ${error}`)
    }
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">MIDI CONVERTER</div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-800 p-2 rounded mb-4">
          <div className="text-white text-xs mb-2">Select MIDI File</div>
          <div className="space-y-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".mid,.midi" onChange={handleFileChange} />
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded w-full"
              onClick={handleSelectFile}
              disabled={isProcessing}
            >
              Select MIDI File
            </button>
            {midiFile && <div className="text-gray-400 text-xs">Selected: {midiFile.name}</div>}

            <button
              className="bg-blue-700 text-white py-1 px-3 text-xs hover:bg-blue-600 rounded w-full"
              onClick={handleParseMIDI}
              disabled={isProcessing || !midiFile}
            >
              {isProcessing ? "Parsing..." : "Parse MIDI File"}
            </button>
          </div>
        </div>

        {midiData && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">MIDI Information</div>
            <div className="text-gray-400 text-xs">
              <div>Format: {midiData.header.format}</div>
              <div>Tracks: {midiData.header.numTracks}</div>
              <div>Ticks per Beat: {midiData.header.ticksPerBeat}</div>
              <div className="mt-1">Track Details:</div>
              <div className="max-h-24 overflow-y-auto pl-2">
                {midiData.tracks.map((track, index) => (
                  <div key={index}>
                    Track {index + 1}: {track.name || "Unnamed"} - {track.notes.length} notes
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input type="checkbox" checked={usePadMapping} onChange={(e) => setUsePadMapping(e.target.checked)} />
                  <span className="text-white text-xs">Use Pad Mapping</span>
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded flex-1"
                  onClick={handleConvertToProgression}
                >
                  Convert to .progression
                </button>
                <button
                  className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded flex-1"
                  onClick={handleConvertToMPCPattern}
                >
                  Convert to .mpcpattern
                </button>
              </div>
            </div>
          </div>
        )}

        {progressionData && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">Progression Data</div>
            <div className="text-gray-400 text-xs">
              <div>Notes: {progressionData.notes.length}</div>
              <div>BPM: {progressionData.meta.bpm}</div>
              {progressionData.meta.timeSignature && (
                <div>
                  Time Signature: {progressionData.meta.timeSignature.numerator}/
                  {progressionData.meta.timeSignature.denominator}
                </div>
              )}
              {progressionData.meta.name && <div>Name: {progressionData.meta.name}</div>}
            </div>

            <button
              className="mt-2 bg-blue-700 text-white py-1 px-3 text-xs hover:bg-blue-600 rounded w-full"
              onClick={handleSaveProgression}
            >
              Save .progression File
            </button>
          </div>
        )}

        {mpcPatternData && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">MPC Pattern Data</div>
            <div className="text-gray-400 text-xs">
              <div>Name: {mpcPatternData.name}</div>
              <div>BPM: {mpcPatternData.bpm}</div>
              <div>
                Time Signature: {mpcPatternData.timeSig.numerator}/{mpcPatternData.timeSig.denominator}
              </div>
              <div>Bars: {mpcPatternData.bars}</div>
              <div>Tracks: {mpcPatternData.tracks.length}</div>
              <div className="mt-1">Track Details:</div>
              <div className="max-h-24 overflow-y-auto pl-2">
                {mpcPatternData.tracks.map((track, index) => (
                  <div key={index}>
                    {track.name}: Pad {track.padId} - {track.events.length} events
                  </div>
                ))}
              </div>
            </div>

            <button
              className="mt-2 bg-blue-700 text-white py-1 px-3 text-xs hover:bg-blue-600 rounded w-full"
              onClick={handleSaveMPCPattern}
            >
              Save .mpcpattern File
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs text-gray-400">{message}</div>
      </div>
    </div>
  )
}

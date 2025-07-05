"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Sequencer, { type SequencerPattern } from "@/lib/sequencer"
import SampleManager from "@/lib/sample-manager"

interface SequencerViewProps {
  isPlaying: boolean
  togglePlayback: () => void
}

export default function SequencerView({ isPlaying, togglePlayback }: SequencerViewProps) {
  const [pattern, setPattern] = useState<SequencerPattern | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [tempo, setTempo] = useState(120)
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)

  useEffect(() => {
    // Get current pattern
    const sequencer = Sequencer.getInstance()
    const currentPattern = sequencer.getCurrentPattern()

    if (currentPattern) {
      setPattern(currentPattern)
      setTempo(sequencer.getTempo())
    }

    // Set up interval to refresh state
    const intervalId = setInterval(() => {
      setCurrentStep(sequencer.getCurrentStep())
    }, 50)

    return () => clearInterval(intervalId)
  }, [])

  const handleStepClick = (trackId: string, stepIndex: number) => {
    const sequencer = Sequencer.getInstance()
    sequencer.toggleStep(trackId, stepIndex)

    // Update pattern state
    const updatedPattern = sequencer.getCurrentPattern()
    if (updatedPattern) {
      setPattern({ ...updatedPattern })
    }
  }

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = Number.parseInt(e.target.value, 10)
    setTempo(newTempo)

    const sequencer = Sequencer.getInstance()
    sequencer.setTempo(newTempo)
  }

  const handleTrackClick = (trackId: string) => {
    setSelectedTrack(trackId === selectedTrack ? null : trackId)
  }

  const getTrackName = (padId: number): string => {
    const sampleManager = SampleManager.getInstance()
    const sample = sampleManager.getSampleForPad(padId)
    return sample ? sample.name : `Pad ${padId + 1}`
  }

  if (!pattern) {
    return (
      <div className="w-full h-full bg-black rounded-md p-2 flex flex-col items-center justify-center">
        <div className="text-white">Loading sequencer...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2 flex justify-between items-center">
        <div>SEQUENCER</div>
        <div className="flex items-center">
          <span className="text-xs mr-2">BPM:</span>
          <input
            type="number"
            min="30"
            max="300"
            value={tempo}
            onChange={handleTempoChange}
            className="w-12 bg-gray-800 text-white text-xs p-1 rounded"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {pattern.tracks.slice(0, 8).map((track) => (
            <div
              key={track.id}
              className={`flex items-center ${selectedTrack === track.id ? "bg-gray-700" : "hover:bg-gray-800"}`}
              onClick={() => handleTrackClick(track.id)}
            >
              <div className="w-20 text-white text-xs truncate p-1">{getTrackName(track.padId)}</div>

              <div className="flex-1 flex">
                {track.steps.slice(0, 16).map((step, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 m-[1px] cursor-pointer border border-gray-700 rounded-sm
                              ${step.active ? "bg-green-500" : "bg-gray-800"}
                              ${currentStep === index && isPlaying ? "ring-1 ring-white" : ""}`}
                    onClick={() => handleStepClick(track.id, index)}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-between">
        <button
          className={`bg-gray-800 text-white py-2 px-4 text-xs hover:bg-gray-700 rounded
                    ${isPlaying ? "bg-green-700" : ""}`}
          onClick={togglePlayback}
        >
          {isPlaying ? "Stop" : "Play"}
        </button>
        <button className="bg-gray-800 text-white py-2 px-4 text-xs hover:bg-gray-700 rounded">Clear</button>
      </div>
    </div>
  )
}

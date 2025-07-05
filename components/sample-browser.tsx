"use client"

import { useState, useEffect } from "react"
import SampleManager, { type Sample } from "@/lib/sample-manager"

interface SampleBrowserProps {
  onSampleSelect: (sample: Sample) => void
  onEditSample?: (sampleId: string) => void
}

export default function SampleBrowser({ onSampleSelect, onEditSample }: SampleBrowserProps) {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortBy, setSortBy] = useState<"name" | "duration">("name")

  useEffect(() => {
    // Get all loaded samples
    const sampleManager = SampleManager.getInstance()
    setSamples(sampleManager.getAllSamples())

    // Set up interval to refresh samples
    const intervalId = setInterval(() => {
      setSamples(sampleManager.getAllSamples())
    }, 500)

    return () => clearInterval(intervalId)
  }, [])

  const handleSampleClick = (sample: Sample) => {
    setSelectedSampleId(sample.id)
    onSampleSelect(sample)

    // Play the sample
    const sampleManager = SampleManager.getInstance()
    sampleManager.playSample(sample.id)
    setIsPlaying(sample.id)

    // Reset playing state after sample duration
    if (sample.duration) {
      setTimeout(() => {
        setIsPlaying(null)
      }, sample.duration * 1000)
    } else {
      setTimeout(() => {
        setIsPlaying(null)
      }, 1000)
    }
  }

  const handleEditSample = (sampleId: string) => {
    if (onEditSample) {
      onEditSample(sampleId)
    }
  }

  const handleDeleteSample = (sampleId: string) => {
    const sampleManager = SampleManager.getInstance()
    sampleManager.deleteSample(sampleId)

    // Update samples list
    setSamples(sampleManager.getAllSamples())

    // Clear selection if the deleted sample was selected
    if (selectedSampleId === sampleId) {
      setSelectedSampleId(null)
    }
  }

  const filteredSamples = samples
    .filter((sample) => sample.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else {
        return a.duration - b.duration
      }
    })

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">SAMPLE BROWSER</div>

      <div className="flex items-center space-x-2 mb-2">
        <input
          type="text"
          placeholder="Search samples..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-800 text-white text-xs p-1 rounded"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "duration")}
          className="bg-gray-800 text-white text-xs p-1 rounded"
        >
          <option value="name">Sort by Name</option>
          <option value="duration">Sort by Duration</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSamples.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            {samples.length === 0
              ? "No samples loaded. Drag and drop audio files to add samples."
              : "No samples match your search."}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredSamples.map((sample) => (
              <div
                key={sample.id}
                className={`p-2 cursor-pointer rounded ${selectedSampleId === sample.id ? "bg-gray-700" : "hover:bg-gray-800"} 
                          ${isPlaying === sample.id ? "border-l-4 border-green-500" : ""}`}
                onClick={() => handleSampleClick(sample)}
              >
                <div className="flex justify-between items-center">
                  <div className="text-white text-sm truncate">{sample.name}</div>
                  <div className="flex space-x-1">
                    <button
                      className="bg-gray-700 text-white py-0.5 px-1 text-xs hover:bg-gray-600 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditSample(sample.id)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-700 text-white py-0.5 px-1 text-xs hover:bg-red-600 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSample(sample.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-gray-400 text-xs">{sample.duration.toFixed(2)}s</div>

                {sample.waveform.length > 0 && (
                  <div className="h-6 w-full flex items-center mt-1">
                    {sample.waveform.map((value, index) => (
                      <div
                        key={index}
                        className="w-1 mx-[0.5px] bg-blue-400"
                        style={{ height: `${value * 100}%` }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

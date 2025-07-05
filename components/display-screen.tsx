"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Settings, Star } from "lucide-react"
import type { Sample } from "@/lib/sample-manager"

interface DisplayScreenProps {
  waveformData: number[]
  onFileDrop: (file: File) => void
  isPlaying: boolean
  togglePlayback: () => void
  currentSample: Sample | null
}

export default function DisplayScreen({
  waveformData,
  onFileDrop,
  isPlaying,
  togglePlayback,
  currentSample,
}: DisplayScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("audio/")) {
        onFileDrop(file)
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileDrop(e.target.files[0])
    }
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-2">
        <Settings size={18} className="text-gray-400" />
        <Star size={18} className="text-gray-400" />
        <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 border border-dashed border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer
                  ${isDragging ? "bg-gray-800" : "bg-gray-900"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} />

        {currentSample ? (
          <div className="w-full h-full flex flex-col">
            <div className="text-white text-center py-2 border-b border-gray-700">{currentSample.name}</div>
            <div className="flex-1 flex items-center justify-center">
              {waveformData.length > 0 ? (
                <div className="w-full px-4">
                  <div className="h-16 w-full flex items-center">
                    <div className="w-full flex items-center">
                      {waveformData.map((value, index) => (
                        <div
                          key={index}
                          className="w-1 mx-[1px] bg-blue-400"
                          style={{ height: `${value * 100}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-1 bg-orange-500 mt-1"></div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <h3 className="text-white text-xl mb-6">DRAG FILES HERE</h3>
        )}
      </div>

      {/* Transport controls */}
      <div className="grid grid-cols-5 gap-1 mt-2">
        <button className="bg-gray-800 text-white py-2 text-xs hover:bg-gray-700">STOP</button>
        <button
          className={`bg-gray-800 text-white py-2 text-xs hover:bg-gray-700 flex items-center justify-center ${isPlaying ? "bg-gray-700" : ""}`}
          onClick={togglePlayback}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
        <button className="bg-gray-800 text-white py-2 text-xs hover:bg-gray-700">▶▶</button>
        <button className="bg-gray-800 text-white py-2 text-xs hover:bg-gray-700">SEQ 1</button>
        <button className="bg-gray-800 text-white py-2 text-xs hover:bg-gray-700">RC</button>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import SampleManager, { type PadAssignment } from "@/lib/sample-manager"

interface PadGridProps {
  onPadSelect?: (padId: number) => void
  selectedPad: number | null
}

export default function PadGrid({ onPadSelect, selectedPad }: PadGridProps) {
  const [activePad, setActivePad] = useState<number | null>(null)
  const [padAssignments, setPadAssignments] = useState<PadAssignment[]>([])

  useEffect(() => {
    // Get initial pad assignments
    const sampleManager = SampleManager.getInstance()
    setPadAssignments(sampleManager.getPadAssignments())

    // Set up interval to refresh pad assignments
    const intervalId = setInterval(() => {
      setPadAssignments(sampleManager.getPadAssignments())
    }, 500)

    return () => clearInterval(intervalId)
  }, [])

  const handlePadClick = (index: number) => {
    setActivePad(index)

    // Play the sample assigned to this pad
    const sampleManager = SampleManager.getInstance()
    sampleManager.playPad(index)

    // Notify parent component
    if (onPadSelect) {
      onPadSelect(index)
    }

    // Reset after animation
    setTimeout(() => setActivePad(null), 200)
  }

  const getPadColor = (index: number) => {
    const assignment = padAssignments.find((a) => a.padId === index)
    return assignment?.color || "from-orange-500 to-red-500"
  }

  const hasSample = (index: number) => {
    const assignment = padAssignments.find((a) => a.padId === index)
    return assignment?.sampleId !== null
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 16 }).map((_, index) => (
        <button
          key={index}
          className={`aspect-square bg-gray-700 rounded-md shadow-md transition-all duration-200 
                    ${activePad === index ? "bg-gray-600 scale-95" : "hover:bg-gray-600"}
                    ${selectedPad === index ? "ring-2 ring-white" : ""}
                    border-b-2 border-gray-800 relative overflow-hidden`}
          onClick={() => handlePadClick(index)}
        >
          <div
            className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${getPadColor(index)} opacity-70`}
          ></div>
          {hasSample(index) && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500"></div>}
        </button>
      ))}
    </div>
  )
}

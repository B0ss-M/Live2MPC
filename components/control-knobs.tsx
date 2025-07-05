"use client"

import { useState, useEffect } from "react"
import AudioContextManager from "@/lib/audio-context"

export default function ControlKnobs() {
  const [knobValues, setKnobValues] = useState([0.5, 0.5, 0.5, 0.5, 0.5])

  useEffect(() => {
    // Set master volume based on first knob
    const audioContext = AudioContextManager.getInstance()
    audioContext.setMasterVolume(knobValues[0])
  }, [knobValues[0]])

  const handleKnobChange = (index: number, value: number) => {
    const newValues = [...knobValues]
    newValues[index] = value
    setKnobValues(newValues)
  }

  return (
    <div className="flex flex-col space-y-8">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="relative">
          <div className="w-14 h-14 rounded-full bg-gray-800 border-4 border-gray-700 shadow-lg flex items-center justify-center">
            <div
              className="w-2 h-10 absolute bg-gray-300 rounded-full origin-center"
              style={{
                transform: `rotate(${knobValues[index] * 270 - 135}deg)`,
                transformOrigin: "center bottom",
              }}
            ></div>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={knobValues[index]}
            onChange={(e) => handleKnobChange(index, Number.parseFloat(e.target.value))}
            className="absolute opacity-0 w-full h-full cursor-pointer top-0 left-0"
          />
        </div>
      ))}

      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gray-800 border-4 border-gray-700 shadow-lg flex items-center justify-center">
          <div className="text-white text-xl">3</div>
          <div className="absolute -bottom-4 text-xs text-gray-800">UNDO</div>
        </div>
      </div>
    </div>
  )
}

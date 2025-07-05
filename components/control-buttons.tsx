"use client"

interface ControlButtonsProps {
  onButtonClick?: (action: string) => void
}

export default function ControlButtons({ onButtonClick }: ControlButtonsProps) {
  const topButtons = [
    { label: "FULL LEVEL", action: "FULL_LEVEL" },
    { label: "½ LEVELS", action: "HALF_LEVELS" },
    { label: "PAD MUTE", action: "PAD_MUTE" },
    { label: "PAD BANK", action: "PAD_BANK" },
  ]

  const bottomButtons = [
    { label: "STOP", action: "STOP" },
    { label: "BROWSE", action: "BROWSE" },
    { label: "MUTE", action: "MUTE" },
    { label: "SOLO", action: "SOLO" },
  ]

  const handleClick = (action: string) => {
    if (onButtonClick) {
      onButtonClick(action)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {topButtons.map((button, index) => (
          <div key={index} className="flex flex-col items-center">
            <button
              className="w-full h-8 bg-gray-700 rounded-sm shadow-md hover:bg-gray-600 transition-colors"
              onClick={() => handleClick(button.action)}
            ></button>
            <span className="text-xs text-center mt-1 text-gray-800">{button.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {bottomButtons.map((button, index) => (
          <div key={index} className="flex flex-col items-center">
            <button
              className="w-full h-8 bg-gray-700 rounded-sm shadow-md hover:bg-gray-600 transition-colors"
              onClick={() => handleClick(button.action)}
            ></button>
            <span className="text-xs text-center mt-1 text-gray-800">{button.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

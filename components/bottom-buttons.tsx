"use client"
import { Button } from "@/components/ui/button"

interface BottomButtonsProps {
  onButtonClick: (buttonName: string) => void
  activeButton?: string
}

export default function BottomButtons({ onButtonClick, activeButton }: BottomButtonsProps) {
  const buttons = ["SAMPLE", "DRUMKIT", "CONVERT", "XPM", "EXPANSION", "BATCH", "SETTINGS", "HELP"]

  return (
    <div className="grid grid-cols-4 gap-2 p-2 bg-gray-800 rounded-md">
      {buttons.map((button) => (
        <Button
          key={button}
          onClick={() => onButtonClick(button)}
          className={`h-12 ${
            activeButton === button
              ? "bg-amber-500 hover:bg-amber-600 text-black"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
          aria-pressed={activeButton === button}
        >
          {button}
        </Button>
      ))}
    </div>
  )
}

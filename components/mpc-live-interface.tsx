"use client"

import { useState, useEffect } from "react"
import PadGrid from "@/components/pad-grid"
import ControlButtons from "@/components/control-buttons"
import DisplayScreen from "@/components/display-screen"
import ControlKnobs from "@/components/control-knobs"
import BottomButtons from "@/components/bottom-buttons"
import SampleBrowser from "@/components/sample-browser"
import SequencerView from "@/components/sequencer-view"
import MIDISettings from "@/components/midi-settings"
import DrumKitView from "@/components/drumkit-view"
import InstrumentView from "@/components/instrument-view"
import SampleEditorView from "@/components/sample-editor-view"
import PresetGeneratorView from "@/components/preset-generator-view"
import MultiVelocityView from "@/components/multi-velocity-view"
import SampleAnalysisView from "@/components/sample-analysis-view"
import BatchProcessingView from "@/components/batch-processing-view"
import XPMImportView from "@/components/xpm-import-view"
import MIDIConverterView from "@/components/midi-converter-view"
import JavaConverterView from "@/components/java-converter-view"

import SampleManager, { type Sample } from "@/lib/sample-manager"
import Sequencer from "@/lib/sequencer"
import MIDIController from "@/lib/midi-controller"
import DrumKitService from "@/lib/services/drumkit-service"
import InstrumentService from "@/lib/services/instrument-service"

type ViewMode =
  | "main"
  | "browser"
  | "sequencer"
  | "midi"
  | "drumkit"
  | "instrument"
  | "sample-editor"
  | "preset-generator"
  | "multi-velocity"
  | "sample-analysis"
  | "batch-processing"
  | "xpm-import"
  | "midi-converter"
  | "java-converter"

export default function MPCLiveInterface() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [currentSample, setCurrentSample] = useState<Sample | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("main")
  const [selectedPad, setSelectedPad] = useState<number | null>(null)
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)

  // Initialize managers
  useEffect(() => {
    const sampleManager = SampleManager.getInstance()
    const sequencer = Sequencer.getInstance()
    const midiController = MIDIController.getInstance()
    const drumKitService = DrumKitService.getInstance()
    const instrumentService = InstrumentService.getInstance()

    // Set up sequencer state listener
    const checkSequencerState = () => {
      setIsPlaying(sequencer.isSequencerPlaying())
    }

    const intervalId = setInterval(checkSequencerState, 100)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const handleFileDrop = async (file: File) => {
    setAudioFile(file)

    const sampleManager = SampleManager.getInstance()
    const sample = await sampleManager.loadSample(file)

    setCurrentSample(sample)
    setWaveformData(sample.waveform)

    // If a pad is selected, assign this sample to it
    if (selectedPad !== null) {
      sampleManager.assignSampleToPad(selectedPad, sample.id)
    }
  }

  const handleTogglePlayback = () => {
    const sequencer = Sequencer.getInstance()

    if (sequencer.isSequencerPlaying()) {
      sequencer.stop()
    } else {
      sequencer.play()
    }

    setIsPlaying(!isPlaying)
  }

  const handlePadSelect = (padId: number) => {
    setSelectedPad(padId)

    // Get sample assigned to this pad
    const sampleManager = SampleManager.getInstance()
    const sample = sampleManager.getSampleForPad(padId)

    if (sample) {
      setCurrentSample(sample)
      setWaveformData(sample.waveform)
    }
  }

  const handleSampleSelect = (sample: Sample) => {
    setCurrentSample(sample)
    setWaveformData(sample.waveform)
    setSelectedSampleId(sample.id)
  }

  const handleButtonClick = (action: string) => {
    switch (action) {
      case "BROWSE":
        setViewMode("browser")
        break
      case "MAIN":
        setViewMode("main")
        break
      case "SEQ":
      case "SEQUENCER":
        setViewMode("sequencer")
        break
      case "MIDI":
        setViewMode("midi")
        break
      case "MIDI_CONVERTER":
        setViewMode("midi-converter")
        break
      case "DRUMKIT":
        setViewMode("drumkit")
        break
      case "INSTRUMENT":
        setViewMode("instrument")
        break
      case "SAMPLE_EDITOR":
        setViewMode("sample-editor")
        break
      case "PRESET_GENERATOR":
        setViewMode("preset-generator")
        break
      case "MULTI_VELOCITY":
        setViewMode("multi-velocity")
        break
      case "SAMPLE_ANALYSIS":
        setViewMode("sample-analysis")
        break
      case "BATCH_PROCESSING":
        setViewMode("batch-processing")
        break
      case "XPM_IMPORT":
        setViewMode("xpm-import")
        break
      case "STOP":
        const sequencer = Sequencer.getInstance()
        sequencer.stop()
        setIsPlaying(false)
        break
      case "JAVA_CONVERTER":
        setViewMode("java-converter")
        break
      default:
        console.log("Button action:", action)
    }
  }

  const handleSampleEdited = (editedSample: Sample) => {
    setCurrentSample(editedSample)
    setWaveformData(editedSample.waveform)
    setViewMode("browser") // Return to browser after editing
  }

  // Render the appropriate view based on mode
  const renderView = () => {
    switch (viewMode) {
      case "browser":
        return (
          <SampleBrowser
            onSampleSelect={handleSampleSelect}
            onEditSample={(id) => {
              setSelectedSampleId(id)
              setViewMode("sample-editor")
            }}
          />
        )
      case "sequencer":
        return <SequencerView isPlaying={isPlaying} togglePlayback={handleTogglePlayback} />
      case "midi":
        return <MIDISettings />
      case "midi-converter":
        return <MIDIConverterView />
      case "drumkit":
        return <DrumKitView selectedPad={selectedPad} />
      case "instrument":
        return <InstrumentView />
      case "sample-editor":
        return (
          <SampleEditorView
            sampleId={selectedSampleId}
            onClose={() => setViewMode("browser")}
            onSave={handleSampleEdited}
          />
        )
      case "preset-generator":
        return <PresetGeneratorView />
      case "multi-velocity":
        return <MultiVelocityView />
      case "sample-analysis":
        return <SampleAnalysisView />
      case "batch-processing":
        return <BatchProcessingView />
      case "xpm-import":
        return <XPMImportView />
      case "java-converter":
        return <JavaConverterView />
      default:
        return (
          <DisplayScreen
            waveformData={waveformData}
            onFileDrop={handleFileDrop}
            isPlaying={isPlaying}
            togglePlayback={handleTogglePlayback}
            currentSample={currentSample}
          />
        )
    }
  }

  return (
    <div className="relative w-full max-w-5xl aspect-[1.5/1] bg-gray-200 rounded-lg shadow-xl overflow-hidden">
      {/* Top bar */}
      <div className="h-8 bg-gray-300 flex items-center px-4 border-b border-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="w-16 h-3 rounded-full bg-gray-100 border border-gray-400"></div>
        </div>
        <div className="flex-1 flex justify-center space-x-8">
          <div className="w-6 h-3 bg-red-500"></div>
          <div className="w-6 h-3 bg-gray-400"></div>
          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div className="w-20 h-3 rounded-md bg-gradient-to-r from-gray-300 to-gray-600 border border-gray-400"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex p-4 h-[calc(100%-8rem)]">
        {/* Left side - Pads and controls */}
        <div className="w-1/2 pr-4 flex flex-col">
          <ControlButtons onButtonClick={handleButtonClick} />
          <div className="flex-1 mt-4">
            <PadGrid onPadSelect={handlePadSelect} selectedPad={selectedPad} />
          </div>
        </div>

        {/* Right side - Display and knobs */}
        <div className="w-1/2 pl-4 flex flex-col">
          <div className="mb-4">
            <div className="text-center text-gray-800">
              <h1 className="text-5xl font-bold tracking-wider">MPC LIVE</h1>
              <p className="text-sm tracking-widest mt-1">MUSIC PRODUCTION CENTER</p>
            </div>
          </div>

          <div className="flex-1 flex">
            <div className="flex-1">{renderView()}</div>
            <div className="ml-4 flex flex-col justify-between">
              <ControlKnobs />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="h-32">
        <div className="h-full flex">
          <div className="w-1/2 flex items-end">
            {/* Speaker grille */}
            <div className="w-full h-24 bg-gray-300 border-t border-gray-400">
              <div className="w-full h-full grid grid-cols-[repeat(auto-fill,minmax(2px,1fr))] gap-[2px]">
                {Array.from({ length: 1000 }).map((_, i) => (
                  <div key={i} className="bg-gray-400 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-1/2 flex items-center justify-center p-2">
            <BottomButtons onButtonClick={handleButtonClick} />
          </div>
        </div>
      </div>
    </div>
  )
}

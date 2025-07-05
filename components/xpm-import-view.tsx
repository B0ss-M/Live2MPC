"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { Sample } from "@/lib/sample-manager"
import { XPMImporter, type XPMProgram } from "@/lib/services/xpm-importer"

export default function XPMImportView() {
  const [xpmFile, setXpmFile] = useState<File | null>(null)
  const [sampleFiles, setSampleFiles] = useState<File[]>([])
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [xpmProgram, setXpmProgram] = useState<XPMProgram | null>(null)
  const [importedSamples, setImportedSamples] = useState<Sample[]>([])

  const xpmFileInputRef = useRef<HTMLInputElement>(null)
  const sampleFilesInputRef = useRef<HTMLInputElement>(null)

  const handleXpmFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setXpmFile(file)

      try {
        setMessage("Parsing XPM file...")

        // Create XPM importer
        const importer = new XPMImporter()

        // Parse the XPM file
        const program = await importer.parseXPMFile(file)
        setXpmProgram(program)

        setMessage(`XPM parsed successfully: ${program.name} (${program.type})`)
      } catch (error) {
        console.error("Failed to parse XPM file:", error)
        setMessage("Failed to parse XPM file")
      }
    }
  }

  const handleSampleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setSampleFiles(files)
      setMessage(`Selected ${files.length} sample files`)
    }
  }

  const handleImport = async () => {
    if (!xpmProgram || sampleFiles.length === 0) {
      setMessage("Please select an XPM file and sample files")
      return
    }

    setIsImporting(true)
    setMessage("Importing XPM program...")

    try {
      // Create XPM importer
      const importer = new XPMImporter()

      // Import the program
      const samples = await importer.importProgram(xpmProgram, sampleFiles)
      setImportedSamples(samples)

      setMessage(`Import complete: ${samples.length} samples imported`)
    } catch (error) {
      console.error("Failed to import XPM program:", error)
      setMessage("Failed to import XPM program")
    } finally {
      setIsImporting(false)
    }
  }

  const handleSelectXpmFile = () => {
    xpmFileInputRef.current?.click()
  }

  const handleSelectSampleFiles = () => {
    sampleFilesInputRef.current?.click()
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">XPM IMPORT</div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-800 p-2 rounded mb-4">
          <div className="text-white text-xs mb-2">Import XPM</div>
          <div className="space-y-2">
            <div>
              <input
                type="file"
                ref={xpmFileInputRef}
                className="hidden"
                accept=".xpm,.xml"
                onChange={handleXpmFileChange}
              />
              <button
                className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded w-full"
                onClick={handleSelectXpmFile}
                disabled={isImporting}
              >
                Select XPM File
              </button>
              {xpmFile && <div className="text-gray-400 text-xs mt-1">Selected: {xpmFile.name}</div>}
            </div>

            <div>
              <input
                type="file"
                ref={sampleFilesInputRef}
                className="hidden"
                accept=".wav,.mp3,.aiff,.aif,.ogg,.flac"
                multiple
                onChange={handleSampleFilesChange}
              />
              <button
                className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded w-full"
                onClick={handleSelectSampleFiles}
                disabled={isImporting}
              >
                Select Sample Files
              </button>
              {sampleFiles.length > 0 && (
                <div className="text-gray-400 text-xs mt-1">Selected: {sampleFiles.length} files</div>
              )}
            </div>

            <button
              className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded w-full"
              onClick={handleImport}
              disabled={isImporting || !xpmProgram || sampleFiles.length === 0}
            >
              {isImporting ? "Importing..." : "Import XPM"}
            </button>
          </div>
        </div>

        {xpmProgram && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">XPM Program</div>
            <div className="text-gray-400 text-xs">
              <div>Name: {xpmProgram.name}</div>
              <div>Type: {xpmProgram.type}</div>
              <div>Samples: {xpmProgram.samples.length}</div>
              {xpmProgram.type === "instrument" && <div>Keygroups: {xpmProgram.keygroups?.length || 0}</div>}
              {xpmProgram.type === "drumkit" && <div>Pads: {xpmProgram.pads?.length || 0}</div>}
            </div>
          </div>
        )}

        {importedSamples.length > 0 && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">Imported Samples</div>
            <div className="max-h-32 overflow-y-auto">
              {importedSamples.map((sample) => (
                <div key={sample.id} className="text-gray-400 text-xs">
                  {sample.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs text-gray-400">{message}</div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { checkJavaInstallation } from "@/lib/utils/java-checker"
import { platform } from "os"

export default function JavaConverterView() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<string>("xpm")
  const [normalize, setNormalize] = useState<boolean>(false)
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const [javaInstalled, setJavaInstalled] = useState<boolean | null>(null)
  const [currentOS, setCurrentOS] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if Java is installed
    const checkJava = async () => {
      const isInstalled = await checkJavaInstallation()
      setJavaInstalled(isInstalled)
    }

    checkJava()

    // Detect operating system
    setCurrentOS(platform())
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setMessage(`Selected file: ${e.target.files[0].name}`)
    }
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleConvert = async () => {
    if (!file) {
      setMessage("Please select a file first")
      return
    }

    if (!javaInstalled) {
      setMessage("Java is not installed. Please install Java to use this feature.")
      return
    }

    setIsConverting(true)
    setMessage("Converting file...")

    try {
      // Create form data for the API call
      const formData = new FormData()
      formData.append("file", file)
      formData.append("format", format)
      formData.append("normalize", normalize.toString())

      // Call the API route
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
      setMessage("Conversion completed successfully!")
    } catch (error) {
      console.error("Conversion error:", error)
      setMessage(`Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsConverting(false)
    }
  }

  // Show a message if Java is not installed
  if (javaInstalled === false) {
    return (
      <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
        <div className="text-white text-center py-2 border-b border-gray-700 mb-2">JAVA CONVERTER</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">Java Not Installed</div>
            <div className="text-white mb-4">Java is required to use the conversion features.</div>
            <div className="text-gray-400 text-sm">
              Please install Java and restart the application.
              <br />
              You can download Java from:{" "}
              <a href="https://www.java.com/download/" className="text-blue-400 underline">
                java.com/download
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">JAVA CONVERTER</div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-800 p-2 rounded mb-4">
          <div className="text-white text-xs mb-2">Convert using mrhyman.jar</div>
          <div className="space-y-2">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded w-full"
              onClick={handleSelectFile}
              disabled={isConverting}
            >
              Select File
            </button>
            {file && <div className="text-gray-400 text-xs">Selected: {file.name}</div>}

            <div className="flex items-center space-x-2">
              <span className="text-white text-xs w-16">Format:</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="flex-1 bg-gray-900 text-white text-xs p-1 rounded"
                disabled={isConverting}
              >
                <option value="xpm">XPM</option>
                <option value="mpc">MPC</option>
                <option value="wav">WAV</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={normalize}
                  onChange={(e) => setNormalize(e.target.checked)}
                  disabled={isConverting}
                />
                <span className="text-white text-xs">Normalize Audio</span>
              </label>
            </div>

            <button
              className="bg-green-700 text-white py-1 px-3 text-xs hover:bg-green-600 rounded w-full"
              onClick={handleConvert}
              disabled={isConverting || !file}
            >
              {isConverting ? "Converting..." : "Convert File"}
            </button>

            {currentOS && (
              <div className="text-gray-400 text-xs mt-2">
                Detected OS: {currentOS === "win32" ? "Windows" : currentOS === "darwin" ? "macOS" : currentOS}
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">Conversion Result</div>
            <div className="text-gray-400 text-xs">
              <div>{result.message}</div>
              <div className="mt-1">Output file: {result.outputFile}</div>
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

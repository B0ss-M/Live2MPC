"use client"

import { useState, useEffect } from "react"
import SampleManager, { type Sample } from "@/lib/sample-manager"
import { SampleAnalyzer, type SampleAnalysis } from "@/lib/services/sample-analyzer"

export default function SampleAnalysisView() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSamples, setSelectedSamples] = useState<string[]>([])
  const [analysisResults, setAnalysisResults] = useState<SampleAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<{
    valid: Sample[]
    invalid: Sample[]
    issues: Map<string, string[]>
  } | null>(null)

  useEffect(() => {
    const sampleManager = SampleManager.getInstance()
    setSamples(sampleManager.getAllSamples())
  }, [])

  const handleSampleSelect = (sampleId: string) => {
    setSelectedSamples((prev) => {
      if (prev.includes(sampleId)) {
        return prev.filter((id) => id !== sampleId)
      } else {
        return [...prev, sampleId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedSamples.length === samples.length) {
      setSelectedSamples([])
    } else {
      setSelectedSamples(samples.map((sample) => sample.id))
    }
  }

  const handleAnalyzeSamples = () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select samples first")
      return
    }

    setIsAnalyzing(true)
    setMessage("Analyzing samples...")

    try {
      // Get selected samples
      const sampleManager = SampleManager.getInstance()
      const selectedSampleObjects = selectedSamples
        .map((id) => sampleManager.getSample(id))
        .filter((sample): sample is Sample => !!sample)

      // Create sample analyzer
      const analyzer = new SampleAnalyzer()

      // Analyze samples
      const results = analyzer.analyzeSamples(selectedSampleObjects)
      setAnalysisResults(results)

      setMessage(
        `Analysis complete: ${results.filter((r) => r.valid).length} valid samples, ${results.filter((r) => !r.valid).length} invalid`,
      )
    } catch (error) {
      console.error("Failed to analyze samples:", error)
      setMessage("Failed to analyze samples")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleValidateSamples = () => {
    if (selectedSamples.length === 0) {
      setMessage("Please select samples first")
      return
    }

    setIsAnalyzing(true)
    setMessage("Validating samples...")

    try {
      // Get selected samples
      const sampleManager = SampleManager.getInstance()
      const selectedSampleObjects = selectedSamples
        .map((id) => sampleManager.getSample(id))
        .filter((sample): sample is Sample => !!sample)

      // Create sample analyzer
      const analyzer = new SampleAnalyzer()

      // Validate samples
      const results = analyzer.validateSamples(selectedSampleObjects)
      setValidationResults(results)

      setMessage(`Validation complete: ${results.valid.length} valid samples, ${results.invalid.length} with issues`)
    } catch (error) {
      console.error("Failed to validate samples:", error)
      setMessage("Failed to validate samples")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFindC3Sample = () => {
    if (samples.length === 0) {
      setMessage("No samples available")
      return
    }

    // Create sample analyzer
    const analyzer = new SampleAnalyzer()

    // Find C3 sample
    const c3Sample = analyzer.extractC3Sample(samples)

    if (c3Sample) {
      setSelectedSamples([c3Sample.id])
      setMessage(`Found C3 sample: ${c3Sample.name}`)
    } else {
      setMessage("No C3 sample found")
    }
  }

  return (
    <div className="w-full h-full bg-black rounded-md p-2 flex flex-col">
      <div className="text-white text-center py-2 border-b border-gray-700 mb-2">SAMPLE ANALYSIS</div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-800 p-2 rounded mb-4">
          <div className="text-white text-xs mb-2">Analysis Tools</div>
          <div className="flex space-x-2">
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
              onClick={handleAnalyzeSamples}
              disabled={isAnalyzing || selectedSamples.length === 0}
            >
              Analyze Samples
            </button>
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
              onClick={handleValidateSamples}
              disabled={isAnalyzing || selectedSamples.length === 0}
            >
              Validate Samples
            </button>
            <button
              className="bg-gray-700 text-white py-1 px-3 text-xs hover:bg-gray-600 rounded flex-1"
              onClick={handleFindC3Sample}
              disabled={isAnalyzing || samples.length === 0}
            >
              Find C3 Sample
            </button>
          </div>
        </div>

        {analysisResults.length > 0 && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">Analysis Results</div>
            <div className="max-h-32 overflow-y-auto">
              {analysisResults.map((result) => (
                <div key={result.id} className="mb-2 border-b border-gray-700 pb-1">
                  <div className="text-white text-xs">{result.name}</div>
                  <div className="text-gray-400 text-xs">
                    {result.valid ? (
                      <>
                        <div>Channels: {result.channels}</div>
                        <div>Sample Rate: {result.sampleRate}Hz</div>
                        <div>Bit Depth: {result.sampleWidth}-bit</div>
                        <div>Duration: {result.duration.toFixed(2)}s</div>
                      </>
                    ) : (
                      <div className="text-red-400">Error: {result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {validationResults && (
          <div className="bg-gray-800 p-2 rounded mb-4">
            <div className="text-white text-xs mb-2">Validation Results</div>
            <div className="max-h-32 overflow-y-auto">
              {validationResults.invalid.map((sample) => {
                const issues = validationResults.issues.get(sample.id) || []
                return (
                  <div key={sample.id} className="mb-2 border-b border-gray-700 pb-1">
                    <div className="text-white text-xs">{sample.name}</div>
                    <div className="text-red-400 text-xs">
                      {issues.map((issue, index) => (
                        <div key={index}>• {issue}</div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {validationResults.invalid.length === 0 && (
                <div className="text-green-400 text-xs">All samples are valid!</div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800 p-2 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="text-white text-xs">Select Samples</div>
            <button
              className="bg-gray-700 text-white py-0.5 px-2 text-xs hover:bg-gray-600 rounded"
              onClick={handleSelectAll}
              disabled={isAnalyzing || samples.length === 0}
            >
              {selectedSamples.length === samples.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {samples.length === 0 ? (
            <div className="text-gray-400 text-xs text-center py-4">
              No samples loaded. Drag and drop audio files to add samples.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className={`p-1 cursor-pointer rounded flex items-center space-x-2 ${
                    selectedSamples.includes(sample.id) ? "bg-gray-700" : "hover:bg-gray-700"
                  }`}
                  onClick={() => handleSampleSelect(sample.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedSamples.includes(sample.id)}
                    onChange={() => {}} // Handled by the div click
                    disabled={isAnalyzing}
                  />
                  <div className="text-white text-xs truncate">{sample.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs text-gray-400">{message}</div>
      </div>
    </div>
  )
}

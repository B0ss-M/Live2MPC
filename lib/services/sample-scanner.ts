import SampleManager, { type Sample } from "../sample-manager"

export interface ScanOptions {
  recursive?: boolean
  includeSubfolders?: boolean
  fileTypes?: string[]
  maxFiles?: number
}

export interface ScanResult {
  totalFiles: number
  loadedFiles: number
  skippedFiles: number
  errors: { file: string; error: string }[]
  samples: Sample[]
}

export class SampleScanner {
  private sampleManager: SampleManager
  private defaultFileTypes = [".wav", ".mp3", ".aiff", ".aif", ".ogg", ".flac"]

  constructor() {
    this.sampleManager = SampleManager.getInstance()
  }

  /**
   * Scans a directory for audio samples
   * Note: In a web context, this requires the user to select a directory
   */
  public async scanDirectory(
    directoryHandle: FileSystemDirectoryHandle,
    options: ScanOptions = {},
  ): Promise<ScanResult> {
    const result: ScanResult = {
      totalFiles: 0,
      loadedFiles: 0,
      skippedFiles: 0,
      errors: [],
      samples: [],
    }

    const fileTypes = options.fileTypes || this.defaultFileTypes
    const maxFiles = options.maxFiles || Number.POSITIVE_INFINITY

    try {
      await this.scanDirectoryRecursive(directoryHandle, result, fileTypes, maxFiles, options.recursive || false)
    } catch (error) {
      console.error("Error scanning directory:", error)
      result.errors.push({ file: directoryHandle.name, error: String(error) })
    }

    return result
  }

  /**
   * Recursively scans a directory for audio samples
   */
  private async scanDirectoryRecursive(
    directoryHandle: FileSystemDirectoryHandle,
    result: ScanResult,
    fileTypes: string[],
    maxFiles: number,
    recursive: boolean,
  ): Promise<void> {
    // Iterate through all entries in the directory
    for await (const [name, handle] of directoryHandle.entries()) {
      // If we've reached the maximum number of files, stop scanning
      if (result.loadedFiles >= maxFiles) {
        break
      }

      // If it's a directory and we're scanning recursively, scan it
      if (handle.kind === "directory" && recursive) {
        await this.scanDirectoryRecursive(handle as FileSystemDirectoryHandle, result, fileTypes, maxFiles, recursive)
      }
      // If it's a file, check if it's an audio file
      else if (handle.kind === "file") {
        const fileHandle = handle as FileSystemFileHandle

        // Check if the file has a supported extension
        const hasValidExtension = fileTypes.some((ext) => name.toLowerCase().endsWith(ext))

        if (hasValidExtension) {
          result.totalFiles++

          try {
            // Get the file
            const file = await fileHandle.getFile()

            // Load the sample
            const sample = await this.sampleManager.loadSample(file)

            // Add the sample to the result
            result.samples.push(sample)
            result.loadedFiles++
          } catch (error) {
            console.error(`Error loading file ${name}:`, error)
            result.errors.push({ file: name, error: String(error) })
            result.skippedFiles++
          }
        } else {
          result.skippedFiles++
        }
      }
    }
  }

  /**
   * Scans multiple files for audio samples
   */
  public async scanFiles(files: File[]): Promise<ScanResult> {
    const result: ScanResult = {
      totalFiles: files.length,
      loadedFiles: 0,
      skippedFiles: 0,
      errors: [],
      samples: [],
    }

    for (const file of files) {
      // Check if the file has a supported extension
      const hasValidExtension = this.defaultFileTypes.some((ext) => file.name.toLowerCase().endsWith(ext))

      if (hasValidExtension) {
        try {
          // Load the sample
          const sample = await this.sampleManager.loadSample(file)

          // Add the sample to the result
          result.samples.push(sample)
          result.loadedFiles++
        } catch (error) {
          console.error(`Error loading file ${file.name}:`, error)
          result.errors.push({ file: file.name, error: String(error) })
          result.skippedFiles++
        }
      } else {
        result.skippedFiles++
      }
    }

    return result
  }

  /**
   * Groups samples by directory structure
   */
  public groupSamplesByDirectory(samples: Sample[]): Map<string, Sample[]> {
    const groups = new Map<string, Sample[]>()

    for (const sample of samples) {
      // Extract directory from sample name
      const directory = this.extractDirectoryFromPath(sample.name)

      if (!groups.has(directory)) {
        groups.set(directory, [])
      }

      groups.get(directory)?.push(sample)
    }

    return groups
  }

  /**
   * Extracts directory from a file path
   */
  private extractDirectoryFromPath(path: string): string {
    // Replace backslashes with forward slashes for consistency
    const normalizedPath = path.replace(/\\/g, "/")

    // Split the path by forward slashes
    const parts = normalizedPath.split("/")

    // If there's only one part, there's no directory
    if (parts.length <= 1) {
      return ""
    }

    // Return the directory (everything except the last part)
    return parts.slice(0, -1).join("/")
  }
}

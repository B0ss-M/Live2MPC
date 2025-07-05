import { JavaBridge } from "./java-bridge"
import path from "path"
import { app } from "electron"

export interface ConversionOptions {
  inputFile: string
  outputFile?: string
  format?: "xpm" | "mpc" | "wav"
  normalize?: boolean
  sampleRate?: number
  bitDepth?: number
}

export class MrHymanConverter {
  private javaBridge: JavaBridge
  private jarPath: string

  constructor() {
    this.javaBridge = JavaBridge.getInstance()

    // For development
    if (process.env.NODE_ENV === "development") {
      this.jarPath = path.join(process.cwd(), "resources", "java", "mrhyman.jar")
    } else {
      // For production (packaged app)
      // In Electron, use app.getAppPath() to get the application directory
      const appPath = app.getAppPath()
      this.jarPath = path.join(appPath, "resources", "java", "mrhyman.jar")
    }
  }

  /**
   * Set the path to the mrhyman.jar file
   */
  public setJarPath(path: string): void {
    this.jarPath = path
  }

  /**
   * Convert a file using mrhyman.jar
   */
  public async convertFile(options: ConversionOptions): Promise<string> {
    const args: string[] = ["-i", options.inputFile]

    if (options.outputFile) {
      args.push("-o", options.outputFile)
    }

    if (options.format) {
      args.push("-f", options.format)
    }

    if (options.normalize) {
      args.push("-n")
    }

    if (options.sampleRate) {
      args.push("-sr", options.sampleRate.toString())
    }

    if (options.bitDepth) {
      args.push("-bd", options.bitDepth.toString())
    }

    try {
      const result = await this.javaBridge.executeJar(this.jarPath, args)

      if (result.stderr && result.stderr.length > 0) {
        throw new Error(`Conversion error: ${result.stderr}`)
      }

      return result.stdout
    } catch (error) {
      console.error("Error executing mrhyman.jar:", error)
      throw error
    }
  }

  /**
   * Convert a sample to XPM format
   */
  public async convertToXPM(inputFile: string, outputFile: string, normalize = false): Promise<string> {
    return this.convertFile({
      inputFile,
      outputFile,
      format: "xpm",
      normalize,
    })
  }

  /**
   * Convert a sample to MPC format
   */
  public async convertToMPC(inputFile: string, outputFile: string, sampleRate = 44100): Promise<string> {
    return this.convertFile({
      inputFile,
      outputFile,
      format: "mpc",
      sampleRate,
    })
  }
}

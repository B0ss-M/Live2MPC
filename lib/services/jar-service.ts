import fs from "fs"
import path from "path"
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

export class JarService {
  private static readonly JAR_DIRECTORY = path.join(process.cwd(), "resources", "jars")
  private static readonly JAR_PATH = path.join(JarService.JAR_DIRECTORY, "mrhyman.jar")

  /**
   * Ensures the jar directory exists
   */
  static async ensureJarDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(JarService.JAR_DIRECTORY)) {
        fs.mkdirSync(JarService.JAR_DIRECTORY, { recursive: true })
        console.log(`Created jar directory at: ${JarService.JAR_DIRECTORY}`)
      }
      return Promise.resolve()
    } catch (error) {
      console.error("Error creating jar directory:", error)
      return Promise.reject(error)
    }
  }

  /**
   * Checks if the mrhyman.jar file exists
   */
  static jarExists(): boolean {
    return fs.existsSync(JarService.JAR_PATH)
  }

  /**
   * Gets the path to the jar file
   */
  static getJarPath(): string {
    return JarService.JAR_PATH
  }

  /**
   * Gets the directory where jar files should be placed
   */
  static getJarDirectory(): string {
    return JarService.JAR_DIRECTORY
  }

  /**
   * Executes the jar file with the given arguments
   */
  static async executeJar(args: string[]): Promise<string> {
    if (!JarService.jarExists()) {
      throw new Error("mrhyman.jar not found. Please place it in the resources/jars directory.")
    }

    const javaHome = process.env.JAVA_HOME || ""
    const javaExecutable = javaHome ? path.join(javaHome, "bin", "java") : "java"

    try {
      const { stdout, stderr } = await execPromise(
        `"${javaExecutable}" -jar "${JarService.JAR_PATH}" ${args.join(" ")}`,
      )

      if (stderr) {
        console.warn("Warning from jar execution:", stderr)
      }

      return stdout
    } catch (error) {
      console.error("Error executing jar:", error)
      throw error
    }
  }
}

import { exec } from "child_process"
import { platform } from "os"

/**
 * This service provides a bridge to execute Java JAR files from the Node.js environment
 */
export class JavaBridge {
  private static instance: JavaBridge
  private javaPath: string
  private maxMemory = "512m" // Default max memory allocation

  private constructor() {
    // Set default Java path based on platform
    this.javaPath = this.getDefaultJavaPath()
  }

  public static getInstance(): JavaBridge {
    if (!JavaBridge.instance) {
      JavaBridge.instance = new JavaBridge()
    }
    return JavaBridge.instance
  }

  /**
   * Get the default Java path based on the operating system
   */
  private getDefaultJavaPath(): string {
    const os = platform()

    if (os === "win32") {
      // On Windows, try to use the JAVA_HOME environment variable
      return process.env.JAVA_HOME ? `"${process.env.JAVA_HOME}\\bin\\java.exe"` : "java"
    } else if (os === "darwin") {
      // On macOS, try to use the JAVA_HOME environment variable
      return process.env.JAVA_HOME ? `"${process.env.JAVA_HOME}/bin/java"` : "java"
    } else {
      // Default for other platforms
      return "java"
    }
  }

  /**
   * Set the path to the Java executable
   */
  public setJavaPath(path: string): void {
    this.javaPath = path
  }

  /**
   * Set the maximum memory allocation for the JVM
   */
  public setMaxMemory(memory: string): void {
    this.maxMemory = memory
  }

  /**
   * Execute a JAR file with the specified arguments
   */
  public executeJar(jarPath: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> {
    // Escape paths for different operating systems
    const escapedJarPath = this.escapePath(jarPath)
    const escapedArgs = args.map((arg) => this.escapePath(arg))

    const command = `${this.javaPath} -Xmx${this.maxMemory} -jar ${escapedJarPath} ${escapedArgs.join(" ")}`

    console.log(`[JavaBridge] Executing: ${command}`)

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`[JavaBridge] Error: ${error.message}`)
          reject(error)
          return
        }

        resolve({ stdout, stderr })
      })
    })
  }

  /**
   * Escape a path for the current operating system
   */
  private escapePath(path: string): string {
    // If the path contains spaces, wrap it in quotes
    if (path.includes(" ")) {
      return `"${path}"`
    }
    return path
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { MrHymanConverter } from "@/lib/services/mrhyman-converter"
import { writeFile } from "fs/promises"
import path from "path"
import os from "os"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const format = formData.get("format") as string
    const normalize = formData.get("normalize") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create temporary directories for input and output
    const tempDir = os.tmpdir()
    const inputPath = path.join(tempDir, file.name)
    const outputPath = path.join(tempDir, `converted_${file.name.split(".")[0]}.${format}`)

    // Write the uploaded file to the temporary directory
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(inputPath, buffer)

    // Create converter instance
    const converter = new MrHymanConverter()

    // Perform conversion
    const result = await converter.convertFile({
      inputFile: inputPath,
      outputFile: outputPath,
      format: format as any,
      normalize,
    })

    return NextResponse.json({
      success: true,
      message: result,
      outputFile: outputPath,
    })
  } catch (error) {
    console.error("Conversion error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { JarService } from "@/lib/services/jar-service"

export async function GET() {
  try {
    await JarService.ensureJarDirectory()

    return NextResponse.json({
      jarExists: JarService.jarExists(),
      jarDirectory: JarService.getJarDirectory(),
    })
  } catch (error) {
    console.error("Error checking jar status:", error)
    return NextResponse.json({ error: "Failed to check jar status" }, { status: 500 })
  }
}

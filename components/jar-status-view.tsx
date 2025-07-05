"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Download, FolderOpen } from "lucide-react"

export default function JarStatusView() {
  const [jarExists, setJarExists] = useState<boolean | null>(null)
  const [jarDirectory, setJarDirectory] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkJarStatus() {
      try {
        const response = await fetch("/api/jar-status")
        const data = await response.json()
        setJarExists(data.jarExists)
        setJarDirectory(data.jarDirectory)
      } catch (error) {
        console.error("Error checking jar status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkJarStatus()
  }, [])

  const openDirectory = () => {
    // This is a client-side function that can't directly open a folder
    // Instead, we'll copy the path to clipboard
    navigator.clipboard
      .writeText(jarDirectory)
      .then(() => {
        alert(`Path copied to clipboard: ${jarDirectory}`)
      })
      .catch((err) => {
        console.error("Failed to copy path:", err)
      })
  }

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Checking jar status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">MrHyman.jar Status</CardTitle>
      </CardHeader>
      <CardContent>
        {jarExists ? (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <AlertTitle>MrHyman.jar Found</AlertTitle>
            <AlertDescription>The jar file is properly installed and ready to use.</AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-amber-50 border-amber-200 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle>MrHyman.jar Not Found</AlertTitle>
            <AlertDescription>Please place the mrhyman.jar file in the resources/jars directory.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Jar Directory:</h3>
            <code className="bg-gray-100 p-2 rounded block overflow-x-auto">{jarDirectory}</code>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={openDirectory} className="flex items-center justify-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Copy Directory Path
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => window.open("https://github.com/yourusername/mpc-tools/releases", "_blank")}
            >
              <Download className="h-4 w-4" />
              Download Instructions
            </Button>
          </div>

          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Installation Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Download the mrhyman.jar file</li>
              <li>Create the resources/jars directory if it doesn't exist</li>
              <li>Place mrhyman.jar in the resources/jars directory</li>
              <li>Restart the application</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

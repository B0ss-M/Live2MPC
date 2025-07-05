import { exec } from "child_process"
import { dialog } from "electron"

export async function checkJavaInstallation(): Promise<boolean> {
  return new Promise((resolve) => {
    exec("java -version", (error) => {
      if (error) {
        dialog.showMessageBox({
          type: "warning",
          title: "Java Not Found",
          message: "Java is required to use the conversion features.",
          detail:
            "Please install Java and restart the application.\n\nYou can download Java from: https://www.java.com/download/",
          buttons: ["OK"],
        })
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

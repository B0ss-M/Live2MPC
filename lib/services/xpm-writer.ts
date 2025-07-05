import type { Instrument } from "./instrument-service"
import SampleManager from "../sample-manager"

export interface XPMZone {
  file: string
  root: number
  low: number
  high: number
  velLow: number
  velHigh: number
}

export class XPMWriter {
  private instrumentName: string
  private programType: "keygroup" | "drumkit"

  constructor(instrumentName = "MyInstrument", programType: "keygroup" | "drumkit" = "keygroup") {
    this.instrumentName = instrumentName
    this.programType = programType
  }

  public createXPM(instrument: Instrument): string {
    const zones = this.createZonesFromInstrument(instrument)
    return this.generateXPMContent(zones)
  }

  public createDrumKitXPM(kitName: string, padAssignments: { [padId: string]: string }): string {
    let xpmContent = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xpmContent += `<PluginProgram name="${kitName}" type="drumkit">\n`
    xpmContent += `  <ProgramInfo>\n`
    xpmContent += `    <Name>${kitName}</Name>\n`
    xpmContent += `    <Type>drumkit</Type>\n`
    xpmContent += `    <Created>${new Date().toISOString()}</Created>\n`
    xpmContent += `  </ProgramInfo>\n`
    xpmContent += `  <DrumKit>\n`

    const sampleManager = SampleManager.getInstance()

    for (const padId in padAssignments) {
      const sampleId = padAssignments[padId]
      const sample = sampleManager.getSample(sampleId)

      if (sample) {
        xpmContent += `    <Pad id="${padId}" sample="${sample.name}" />\n`
      }
    }

    xpmContent += `  </DrumKit>\n`
    xpmContent += `</PluginProgram>`

    return xpmContent
  }

  private createZonesFromInstrument(instrument: Instrument): XPMZone[] {
    const zones: XPMZone[] = []
    const sampleManager = SampleManager.getInstance()

    for (const keygroup of instrument.keygroups) {
      for (const layer of keygroup.velocityLayers) {
        if (!layer.sampleId) continue

        const sample = sampleManager.getSample(layer.sampleId)
        if (!sample) continue

        zones.push({
          file: sample.name,
          root: keygroup.rootNote,
          low: keygroup.lowNote,
          high: keygroup.highNote,
          velLow: layer.lowVelocity,
          velHigh: layer.highVelocity,
        })
      }
    }

    return zones
  }

  private generateXPMContent(zones: XPMZone[]): string {
    let xpmContent = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xpmContent += `<PluginProgram name="${this.instrumentName}" type="${this.programType}">\n`
    xpmContent += `  <ProgramInfo>\n`
    xpmContent += `    <Name>${this.instrumentName}</Name>\n`
    xpmContent += `    <Type>${this.programType}</Type>\n`
    xpmContent += `    <Created>${new Date().toISOString()}</Created>\n`
    xpmContent += `  </ProgramInfo>\n`
    xpmContent += `  <Keygroup>\n`

    for (const zone of zones) {
      xpmContent += `    <Zone file="${zone.file}" root="${zone.root}" low="${zone.low}" high="${zone.high}" vel_low="${zone.velLow}" vel_high="${zone.velHigh}" />\n`
    }

    xpmContent += `  </Keygroup>\n`
    xpmContent += `</PluginProgram>`

    return xpmContent
  }
}

import SampleManager from "./sample-manager"
import Sequencer from "./sequencer"

export interface MIDIDeviceInfo {
  id: string
  name: string
  manufacturer: string
  type: "input" | "output"
}

class MIDIController {
  private static instance: MIDIController
  private midiAccess: WebMidi.MIDIAccess | null = null
  private inputs: Map<string, WebMidi.MIDIInput> = new Map()
  private outputs: Map<string, WebMidi.MIDIOutput> = new Map()
  private sampleManager: SampleManager
  private sequencer: Sequencer
  private padMappings: Map<number, number> = new Map() // MIDI note -> pad ID

  private constructor() {
    this.sampleManager = SampleManager.getInstance()
    this.sequencer = Sequencer.getInstance()
    this.initMIDI()
    this.setupDefaultMappings()
  }

  public static getInstance(): MIDIController {
    if (!MIDIController.instance) {
      MIDIController.instance = new MIDIController()
    }
    return MIDIController.instance
  }

  private setupDefaultMappings(): void {
    // Default mapping for MPC-style 4x4 grid (starting at MIDI note 36)
    const mpcNotes = [
      36,
      37,
      38,
      39, // Row 1
      40,
      41,
      42,
      43, // Row 2
      44,
      45,
      46,
      47, // Row 3
      48,
      49,
      50,
      51, // Row 4
    ]

    // Map to our 0-15 pad IDs
    mpcNotes.forEach((note, index) => {
      this.padMappings.set(note, index)
    })
  }

  private async initMIDI(): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      console.warn("WebMIDI is not supported in this browser")
      return
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false })

      // Set up listeners for MIDI devices
      this.midiAccess.addEventListener("statechange", this.handleStateChange.bind(this))

      // Initialize available devices
      this.updateDevices()
    } catch (error) {
      console.error("Failed to access MIDI devices:", error)
    }
  }

  private updateDevices(): void {
    if (!this.midiAccess) return

    // Clear existing devices
    this.inputs.clear()
    this.outputs.clear()

    // Add inputs
    this.midiAccess.inputs.forEach((input) => {
      this.inputs.set(input.id, input)
      input.addEventListener("midimessage", this.handleMIDIMessage.bind(this))
    })

    // Add outputs
    this.midiAccess.outputs.forEach((output) => {
      this.outputs.set(output.id, output)
    })
  }

  private handleStateChange(event: WebMidi.MIDIConnectionEvent): void {
    console.log("MIDI state change:", event.port.name, event.port.state)
    this.updateDevices()
  }

  private handleMIDIMessage(event: WebMidi.MIDIMessageEvent): void {
    const [status, data1, data2] = event.data

    // Note On message (144-159)
    if (status >= 144 && status <= 159 && data2 > 0) {
      const note = data1
      const velocity = data2 / 127 // Normalize to 0-1

      // Check if this note is mapped to a pad
      const padId = this.padMappings.get(note)
      if (padId !== undefined) {
        // Trigger the pad with velocity
        this.sampleManager.playPad(padId)
      }
    }

    // Note Off message (128-143) or Note On with velocity 0
    else if ((status >= 128 && status <= 143) || (status >= 144 && status <= 159 && data2 === 0)) {
      // Handle note off if needed
    }

    // Control Change message (176-191)
    else if (status >= 176 && status <= 191) {
      const controller = data1
      const value = data2 / 127 // Normalize to 0-1

      // Handle common controllers
      switch (controller) {
        case 120: // All Sound Off
        case 123: // All Notes Off
          // Stop all samples
          break

        // Add more controller mappings as needed
      }
    }
  }

  public getAvailableDevices(): MIDIDeviceInfo[] {
    const devices: MIDIDeviceInfo[] = []

    this.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || "Unknown Device",
        manufacturer: input.manufacturer || "Unknown Manufacturer",
        type: "input",
      })
    })

    this.outputs.forEach((output) => {
      devices.push({
        id: output.id,
        name: output.name || "Unknown Device",
        manufacturer: output.manufacturer || "Unknown Manufacturer",
        type: "output",
      })
    })

    return devices
  }

  public sendNoteOn(note: number, velocity = 127, channel = 0): void {
    const status = 144 + (channel & 0xf) // Note On on specified channel
    this.sendMIDIMessage([status, note & 0x7f, velocity & 0x7f])
  }

  public sendNoteOff(note: number, velocity = 0, channel = 0): void {
    const status = 128 + (channel & 0xf) // Note Off on specified channel
    this.sendMIDIMessage([status, note & 0x7f, velocity & 0x7f])
  }

  private sendMIDIMessage(data: number[]): void {
    this.outputs.forEach((output) => {
      output.send(data)
    })
  }

  public mapPadToNote(padId: number, note: number): void {
    this.padMappings.set(note, padId)
  }

  public getPadMappings(): Map<number, number> {
    return new Map(this.padMappings)
  }
}

export default MIDIController

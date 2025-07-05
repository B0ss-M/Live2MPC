export interface MIDINote {
  note: number
  velocity: number
  time: number
  duration: number
  channel: number
}

export interface MIDIEvent {
  type: string
  subtype?: string
  deltaTime: number
  channel?: number
  noteNumber?: number
  velocity?: number
  controllerType?: number
  value?: number
  text?: string
  metaType?: number
  key?: number
  scale?: number
  numerator?: number
  denominator?: number
  data?: Uint8Array
}

export interface MIDITrack {
  name?: string
  events: MIDIEvent[]
  notes: MIDINote[]
}

export interface MIDIData {
  header: {
    format: number
    numTracks: number
    ticksPerBeat: number
  }
  tracks: MIDITrack[]
}

export interface ProgressionData {
  notes: MIDINote[]
  meta: {
    source: string
    bpm: number
    timeSignature?: {
      numerator: number
      denominator: number
    }
    name?: string
  }
}

export interface MPCPatternData {
  name: string
  bpm: number
  swing: number
  bars: number
  timeSig: {
    numerator: number
    denominator: number
  }
  tracks: MPCPatternTrack[]
}

export interface MPCPatternTrack {
  id: string
  name: string
  padId: number
  events: MPCPatternEvent[]
}

export interface MPCPatternEvent {
  tick: number
  duration: number
  velocity: number
  probability: number
  repeat?: {
    rate: number
    count: number
  }
}

export class MIDIConverter {
  /**
   * Parse a MIDI file and extract its data
   */
  public async parseMIDIFile(file: File): Promise<MIDIData> {
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    return this.parseMIDIData(data)
  }

  /**
   * Parse MIDI data from a Uint8Array
   */
  private parseMIDIData(data: Uint8Array): MIDIData {
    let pos = 0

    // Parse header
    const headerChunk = this.readChunk(data, pos)
    pos += 8 + headerChunk.length

    if (headerChunk.id !== "MThd") {
      throw new Error("Invalid MIDI file: missing MThd header")
    }

    const view = new DataView(headerChunk.data.buffer)
    const format = view.getUint16(0)
    const numTracks = view.getUint16(2)
    const ticksPerBeat = view.getUint16(4)

    // Parse tracks
    const tracks: MIDITrack[] = []

    for (let i = 0; i < numTracks; i++) {
      if (pos >= data.length) break

      const trackChunk = this.readChunk(data, pos)
      pos += 8 + trackChunk.length

      if (trackChunk.id !== "MTrk") {
        throw new Error(`Invalid MIDI file: expected MTrk, got ${trackChunk.id}`)
      }

      const trackEvents = this.parseTrackEvents(trackChunk.data)
      const trackNotes = this.extractNotes(trackEvents)
      const trackName = this.extractTrackName(trackEvents)

      tracks.push({
        name: trackName,
        events: trackEvents,
        notes: trackNotes,
      })
    }

    return {
      header: {
        format,
        numTracks,
        ticksPerBeat,
      },
      tracks,
    }
  }

  /**
   * Read a MIDI chunk
   */
  private readChunk(data: Uint8Array, pos: number): { id: string; length: number; data: Uint8Array } {
    const id = String.fromCharCode(data[pos], data[pos + 1], data[pos + 2], data[pos + 3])
    const length = (data[pos + 4] << 24) | (data[pos + 5] << 16) | (data[pos + 6] << 8) | data[pos + 7]
    const chunkData = data.slice(pos + 8, pos + 8 + length)

    return { id, length, data: chunkData }
  }

  /**
   * Parse MIDI track events
   */
  private parseTrackEvents(data: Uint8Array): MIDIEvent[] {
    const events: MIDIEvent[] = []
    let pos = 0
    let runningStatus = 0

    while (pos < data.length) {
      // Read delta time
      let deltaTime = 0
      let byte

      do {
        byte = data[pos++]
        deltaTime = (deltaTime << 7) | (byte & 0x7f)
      } while (byte & 0x80)

      // Read event type
      let eventType = data[pos]

      // Handle running status
      if ((eventType & 0x80) === 0) {
        eventType = runningStatus
      } else {
        pos++
        runningStatus = eventType
      }

      // Handle event based on type
      if ((eventType & 0xf0) === 0x80) {
        // Note Off
        const channel = eventType & 0x0f
        const noteNumber = data[pos++]
        const velocity = data[pos++]

        events.push({
          type: "noteOff",
          deltaTime,
          channel,
          noteNumber,
          velocity,
        })
      } else if ((eventType & 0xf0) === 0x90) {
        // Note On
        const channel = eventType & 0x0f
        const noteNumber = data[pos++]
        const velocity = data[pos++]

        events.push({
          type: velocity === 0 ? "noteOff" : "noteOn",
          deltaTime,
          channel,
          noteNumber,
          velocity,
        })
      } else if ((eventType & 0xf0) === 0xa0) {
        // Note Aftertouch
        const channel = eventType & 0x0f
        const noteNumber = data[pos++]
        const amount = data[pos++]

        events.push({
          type: "noteAftertouch",
          deltaTime,
          channel,
          noteNumber,
          value: amount,
        })
      } else if ((eventType & 0xf0) === 0xb0) {
        // Controller
        const channel = eventType & 0x0f
        const controllerType = data[pos++]
        const value = data[pos++]

        events.push({
          type: "controller",
          deltaTime,
          channel,
          controllerType,
          value,
        })
      } else if ((eventType & 0xf0) === 0xc0) {
        // Program Change
        const channel = eventType & 0x0f
        const value = data[pos++]

        events.push({
          type: "programChange",
          deltaTime,
          channel,
          value,
        })
      } else if ((eventType & 0xf0) === 0xd0) {
        // Channel Aftertouch
        const channel = eventType & 0x0f
        const value = data[pos++]

        events.push({
          type: "channelAftertouch",
          deltaTime,
          channel,
          value,
        })
      } else if ((eventType & 0xf0) === 0xe0) {
        // Pitch Bend
        const channel = eventType & 0x0f
        const lsb = data[pos++]
        const msb = data[pos++]
        const value = (msb << 7) | lsb

        events.push({
          type: "pitchBend",
          deltaTime,
          channel,
          value,
        })
      } else if (eventType === 0xff) {
        // Meta Event
        const metaType = data[pos++]
        let length = 0
        let byte

        do {
          byte = data[pos++]
          length = (length << 7) | (byte & 0x7f)
        } while (byte & 0x80)

        const metaData = data.slice(pos, pos + length)
        pos += length

        if (metaType === 0x01) {
          // Text Event
          const text = this.decodeText(metaData)
          events.push({
            type: "meta",
            subtype: "text",
            deltaTime,
            text,
          })
        } else if (metaType === 0x03) {
          // Track Name
          const text = this.decodeText(metaData)
          events.push({
            type: "meta",
            subtype: "trackName",
            deltaTime,
            text,
          })
        } else if (metaType === 0x51) {
          // Tempo
          const tempo = (metaData[0] << 16) | (metaData[1] << 8) | metaData[2]
          events.push({
            type: "meta",
            subtype: "tempo",
            deltaTime,
            value: tempo,
          })
        } else if (metaType === 0x58) {
          // Time Signature
          events.push({
            type: "meta",
            subtype: "timeSignature",
            deltaTime,
            numerator: metaData[0],
            denominator: Math.pow(2, metaData[1]),
          })
        } else if (metaType === 0x59) {
          // Key Signature
          events.push({
            type: "meta",
            subtype: "keySignature",
            deltaTime,
            key: metaData[0],
            scale: metaData[1],
          })
        } else if (metaType === 0x2f) {
          // End of Track
          events.push({
            type: "meta",
            subtype: "endOfTrack",
            deltaTime,
          })
        } else {
          // Other Meta Event
          events.push({
            type: "meta",
            metaType,
            deltaTime,
            data: metaData,
          })
        }
      } else {
        // Unknown event type
        console.warn(`Unknown MIDI event type: ${eventType.toString(16)}`)
        pos += 2 // Skip data bytes
      }
    }

    return events
  }

  /**
   * Extract notes from MIDI events
   */
  private extractNotes(events: MIDIEvent[]): MIDINote[] {
    const notes: MIDINote[] = []
    const activeNotes: Map<string, { note: number; velocity: number; time: number; channel: number }> = new Map()
    let currentTime = 0

    for (const event of events) {
      currentTime += event.deltaTime

      if (
        event.type === "noteOn" &&
        event.noteNumber !== undefined &&
        event.velocity !== undefined &&
        event.channel !== undefined
      ) {
        const key = `${event.noteNumber}-${event.channel}`
        activeNotes.set(key, {
          note: event.noteNumber,
          velocity: event.velocity,
          time: currentTime,
          channel: event.channel,
        })
      } else if (event.type === "noteOff" && event.noteNumber !== undefined && event.channel !== undefined) {
        const key = `${event.noteNumber}-${event.channel}`
        const startNote = activeNotes.get(key)

        if (startNote) {
          notes.push({
            note: startNote.note,
            velocity: startNote.velocity,
            time: startNote.time,
            duration: currentTime - startNote.time,
            channel: startNote.channel,
          })

          activeNotes.delete(key)
        }
      }
    }

    // Handle any still-active notes
    activeNotes.forEach((startNote, key) => {
      notes.push({
        note: startNote.note,
        velocity: startNote.velocity,
        time: startNote.time,
        duration: 0, // Unknown duration
        channel: startNote.channel,
      })
    })

    return notes
  }

  /**
   * Extract track name from MIDI events
   */
  private extractTrackName(events: MIDIEvent[]): string | undefined {
    for (const event of events) {
      if (event.type === "meta" && event.subtype === "trackName" && event.text) {
        return event.text
      }
    }

    return undefined
  }

  /**
   * Decode text from a Uint8Array
   */
  private decodeText(data: Uint8Array): string {
    try {
      return new TextDecoder().decode(data)
    } catch (e) {
      // Fallback for older browsers
      let result = ""
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data[i])
      }
      return result
    }
  }

  /**
   * Convert MIDI data to progression format
   */
  public convertToProgression(midiData: MIDIData): ProgressionData {
    // Extract notes from all tracks
    const allNotes: MIDINote[] = []
    midiData.tracks.forEach((track) => {
      allNotes.push(...track.notes)
    })

    // Sort notes by time
    allNotes.sort((a, b) => a.time - b.time)

    // Extract tempo and time signature
    let bpm = 120 // Default BPM
    let timeSignature = { numerator: 4, denominator: 4 } // Default time signature
    let trackName = ""

    for (const track of midiData.tracks) {
      for (const event of track.events) {
        if (event.type === "meta" && event.subtype === "tempo" && event.value) {
          // Convert microseconds per quarter note to BPM
          bpm = Math.round(60000000 / event.value)
        }

        if (event.type === "meta" && event.subtype === "timeSignature" && event.numerator && event.denominator) {
          timeSignature = {
            numerator: event.numerator,
            denominator: event.denominator,
          }
        }

        if (event.type === "meta" && event.subtype === "trackName" && event.text) {
          trackName = event.text
        }
      }
    }

    return {
      notes: allNotes,
      meta: {
        source: "midi",
        bpm,
        timeSignature,
        name: trackName || undefined,
      },
    }
  }

  /**
   * Convert MIDI data to MPC pattern format
   */
  public convertToMPCPattern(midiData: MIDIData, padMapping?: Map<number, number>): MPCPatternData {
    // Extract tempo and time signature
    let bpm = 120 // Default BPM
    let timeSignature = { numerator: 4, denominator: 4 } // Default time signature
    let trackName = ""

    for (const track of midiData.tracks) {
      for (const event of track.events) {
        if (event.type === "meta" && event.subtype === "tempo" && event.value) {
          // Convert microseconds per quarter note to BPM
          bpm = Math.round(60000000 / event.value)
        }

        if (event.type === "meta" && event.subtype === "timeSignature" && event.numerator && event.denominator) {
          timeSignature = {
            numerator: event.numerator,
            denominator: event.denominator,
          }
        }

        if (event.type === "meta" && event.subtype === "trackName" && event.text) {
          trackName = event.text
        }
      }
    }

    // Calculate number of bars based on notes
    let maxTick = 0
    midiData.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        const endTick = note.time + note.duration
        if (endTick > maxTick) {
          maxTick = endTick
        }
      })
    })

    // Assuming 4/4 time signature and 960 ticks per beat
    const ticksPerBeat = midiData.header.ticksPerBeat
    const ticksPerBar = ticksPerBeat * timeSignature.numerator
    const bars = Math.ceil(maxTick / ticksPerBar)

    // Group notes by MIDI channel or note number
    const notesByTrack = new Map<number, MIDINote[]>()

    midiData.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        // Use channel as track identifier, or note number if no mapping is provided
        const trackId = padMapping ? padMapping.get(note.note) || note.note : note.channel

        if (!notesByTrack.has(trackId)) {
          notesByTrack.set(trackId, [])
        }

        notesByTrack.get(trackId)?.push(note)
      })
    })

    // Convert to MPC pattern tracks
    const tracks: MPCPatternTrack[] = []

    notesByTrack.forEach((notes, trackId) => {
      const events: MPCPatternEvent[] = notes.map((note) => ({
        tick: note.time,
        duration: note.duration,
        velocity: note.velocity,
        probability: 1.0, // Default probability
      }))

      tracks.push({
        id: `track_${trackId}`,
        name: `Track ${trackId}`,
        padId: trackId,
        events,
      })
    })

    return {
      name: trackName || "Imported Pattern",
      bpm,
      swing: 0, // Default swing
      bars,
      timeSig: timeSignature,
      tracks,
    }
  }

  /**
   * Save progression data to a file
   */
  public saveProgressionToFile(progression: ProgressionData, filename: string): void {
    const json = JSON.stringify(progression, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    this.saveBlob(blob, filename)
  }

  /**
   * Save MPC pattern data to a file
   */
  public saveMPCPatternToFile(pattern: MPCPatternData, filename: string): void {
    const json = JSON.stringify(pattern, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    this.saveBlob(blob, filename)
  }

  /**
   * Save a blob to a file
   */
  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

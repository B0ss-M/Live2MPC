# MPC Fixer

A modern web application for MPC Live instrument creation, sample management, and conversion.

![MPC Fixer Screenshot](/public/mpc-live-interface.png)

## Overview

MPC Fixer is a comprehensive tool designed for music producers working with Akai MPC Live and similar hardware. It provides a suite of tools for sample management, drum kit creation, instrument building, and file conversion, all within a realistic MPC-style interface.

## Features

### Sample Management

- **Sample Browser**: Browse, preview, and organize your sample library
- **Waveform Visualization**: View and analyze sample waveforms
- **Sample Bank Manager**: Organize samples into banks for easy access
- **Sample Classification**: Automatically classify samples by type (kick, snare, etc.)
- **Key Detection**: Automatically detect the musical key of melodic samples

### Drum Kit Creation

- **Pad Assignment**: Assign samples to specific pads
- **Velocity Layers**: Create multi-velocity sample layers for dynamic playing
- **ADSR Envelope Controls**: Shape the amplitude of sounds over time
  - Control attack time, decay time, sustain level, and release time
  - Visual envelope editor with interactive control points
  - Preset envelopes for common sound types (pluck, pad, etc.)
  - Individual envelope settings per pad/sample
- **Pad Effects**: Apply effects to individual pads
- **Color Customization**: Customize pad colors for visual organization

### VST Autosampling

- **Plugin Integration**: Host and control VST plugins for sampling
- **Parameter Automation**: Automate VST parameters during sampling
  - Multiple curve types (linear, exponential, logarithmic, S-curve, step)
  - Visual curve editor with interactive control points
  - Independent enable/disable of each parameter automation
  - Duration control for synchronizing multiple parameter changes
  - Real-time preview of parameter changes
- **Multi-Format Export**: Export samples in various formats
- **Batch Processing**: Process multiple plugins or presets in batch

### Instrument Building

- **Keygroup Mapping**: Map samples across the keyboard
- **Zone Editor**: Create and edit sample zones
- **Articulation Support**: Support for multiple articulations
- **Round-Robin**: Implement round-robin sample playback for realism

### File Conversion

- **Format Conversion**: Convert between different audio file formats
- **XPM Operations**: Create and edit XPM files for MPC
- **Expansion Building**: Create MPC expansion packs
- **Batch Processing**: Process multiple files at once

### Sequencing

- **Pattern Sequencer**: Create and edit drum patterns
- **Piano Roll**: Edit melodic sequences with piano roll interface
- **FL Studio-style Sequencer**: Alternative sequencing interface
- **MIDI Import/Export**: Import and export MIDI files

### Chord Progressions

- **Chord Editor**: Create and edit chord progressions
- **Progression Analysis**: Analyze chord progressions for common patterns
- **MIDI Parsing**: Extract chord progressions from MIDI files
- **Progression Templates**: Pre-defined progression templates

### Advanced Algorithms

- **Beat Detection**: Automatically detect tempo and beats
- **Pattern Generation**: Generate drum patterns algorithmically
- **Audio Separation**: Separate stems from mixed audio
- **Key Detection**: Detect musical key of audio samples

## Installation

### Prerequisites

- Node.js 16.x or higher
- Java Runtime Environment (JRE) 11 or higher (for mrhyman.jar functionality)
- Visual Studio Code (recommended for development)

### Setup

1. Clone this repository
   \`\`\`bash
   git clone https://github.com/yourusername/mpc-fixer.git
   cd mpc-fixer
   \`\`\`

2. Run the setup script
   \`\`\`bash
   chmod +x setup.sh
   ./setup.sh
   \`\`\`

3. Start the development server
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Docker Setup

MPC Fixer can be run in Docker containers for both development and production environments.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Development Container

\`\`\`bash
# Start the development container
npm run docker:dev

# Access the application at http://localhost:3000
\`\`\`

### Production Container

\`\`\`bash
# Start the production container
npm run docker:prod

# Access the application at http://localhost:3001
\`\`\`

For detailed Docker instructions, see [DOCKER.md](DOCKER.md).

## Continuous Integration and Deployment

This project uses GitHub Actions for continuous integration and deployment.

### CI/CD Workflows

- **Continuous Integration**: Runs tests and builds the application on every push and pull request
- **Docker Build**: Builds and pushes Docker images to GitHub Container Registry
- **Deployment**: Automatically deploys to GitHub Pages and Vercel
- **Electron Build**: Builds the Electron app for Windows, macOS, and Linux
- **Release**: Creates GitHub Releases with built artifacts

For detailed CI/CD information, see [CI_CD.md](CI_CD.md).

## Usage

### Sample Management

1. Navigate to the Sample Browser view
2. Upload samples using the file browser or drag-and-drop
3. Preview samples by clicking on them
4. Organize samples into categories and banks

### Creating Drum Kits

1. Navigate to the Drumkit view
2. Assign samples to pads by dragging from the browser or clicking "Assign"
3. Configure ADSR envelope for each pad:
   - Click on a pad to select it
   - Adjust envelope parameters using the visual editor or sliders
   - Preview the sound with the envelope applied
4. Save your drum kit using the Save button

### VST Parameter Automation

1. Navigate to the Sampling Config view
2. Load a VST plugin
3. Select parameters to automate
4. Create automation curves:
   - Add control points by clicking on the curve editor
   - Select curve type (linear, exponential, etc.)
   - Adjust duration and range
5. Preview the automation
6. Start sampling to record with automation applied

### File Conversion

1. Navigate to the Convert view
2. Upload files to convert
3. Select output format and options
4. Click "Convert" to process files

## Technical Details

### ADSR Envelope Implementation

The ADSR envelope controls use Web Audio API's GainNode with scheduled parameter changes to shape the amplitude of sounds over time:

- **Attack**: Time taken for initial run-up of level from 0 to peak
- **Decay**: Time taken for the subsequent run down from peak to sustain level
- **Sustain**: Level during the main sequence of the sound's duration
- **Release**: Time taken for the level to decay from sustain to 0 after note release

### VST Parameter Automation

Parameter automation during sampling is implemented using:

- Custom curve algorithms for different automation types
- Real-time parameter value calculation based on elapsed time
- Synchronization with the sampling process
- Storage of automation data with samples

## Development

### Project Structure

- `/app`: Next.js app directory
- `/components`: React components
- `/lib`: Utility functions and services
- `/public`: Static assets
- `/src`: Electron app source code

### Key Technologies

- Next.js for the web application
- React for the UI components
- Tailwind CSS for styling
- Web Audio API for audio processing
- Electron for desktop application packaging

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - email@example.com

Project Link: [https://github.com/yourusername/mpc-fixer](https://github.com/yourusername/mpc-fixer)

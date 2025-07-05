# MPC Fixer Project: Development Phases Summary

## 🔷 Phase 1 – Backend Foundation & Core Architecture

### 1.1 Backend Services & Utilities
- Set up FastAPI backend with modular routing
- Create utility modules for:
  - Sample analysis (pitch, duration)
  - File parsing (XPM reader/writer)
  - Velocity layer mapping
  - Directory and sample validation

### 1.2 XPM Structure & Sample Kit Foundation
- Create modules for:
  - Generating XPM files from sample sets
  - Mapping samples across velocity/key zones
  - Batch building drum kits and keygroup instruments
  - Normalizing and standardizing sample metadata

- API Endpoints:
  - `/upload-samples`
  - `/create-drumkit`
  - `/create-instrument`
  - `/analyze-sample`
  - `/map-velocity-layers`

---

## 🔷 Phase 2 – Feature Integration & Functionality Expansion

### 2.1 XPM Fixer Module
- Detect missing samples, broken paths, invalid keys
- Auto-repair sample mappings and root key alignment
- Intelligent re-layering based on velocity/sample range
- Rename invalid/long sample names

### 2.2 Sample Analyzer
- Pitch detection via `librosa`
- Detect key from filename or audio analysis
- Allow tuning samples by semitones or cents

### 2.3 Preview Generator
- For drum kits: auto sequence and export rhythmic demo
- For instruments: play and render single note (C3) or MIDI phrase
- Place preview `.wav` file into `[Preview]` folder and name after instrument

### 2.4 API Enhancements
- `/fix-xpm`
- `/generate-preview`
- `/rename-samples`
- `/analyze-folder`
- `/export-kit`

---

## 🔷 Phase 3 – Finalization, UI Polish & MPC Expansion Integration

### 3.1 Expansion Builder
- Create `expansion.xml` with metadata
- Generate structure:
  - Instruments/ or kits/
  - Samples/
  - Preview/
  - icon.jpg
- Custom UUID & tag generation

### 3.2 Advanced Fixer Logic
- Move samples to proper root octaves
- Allow renaming conventions
- Batch-fix multiple folders
- Generate velocity-accurate XPMs
- Patch in missing preview audio

### 3.3 Preview System
- Export named audio clips into `Preview` folder
- Detect and render preview using:
  - Single sample (C3)
  - Loaded MIDI pattern

### 3.4 UI Polish & Frontend Integration
- MPC-style layout using Tailwind CSS
- Fully interactive:
  - Pads playable (MIDI/audio)
  - Screen dynamic and file-aware
  - Buttons mapped to actions (octave, tuning, etc.)
- Modal prompts for fixes, validations, exports

### 3.5 Batch Automation Tools
- Multi-folder support
- Fix and export hundreds of kits or instruments
- CLI tool and background service

---

Final goal: Deliver MPC-ready instruments, kits, and expansions with previews, tuned samples, and fully fixed metadata — usable directly on MPC hardware.
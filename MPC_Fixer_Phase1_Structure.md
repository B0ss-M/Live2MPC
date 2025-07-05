```text

MPC_Fixer_Complete_Merged_Final/
│
├── backend/                          # Backend FastAPI application
│   ├── main.py                       # API entry point
│   ├── config.py                     # Configuration settings
│   ├── utils/                        # Utility and helper scripts
│   │   ├── file_utils.py             # File handling: scanning folders, saving, checking extensions
│   │   ├── midi_utils.py             # MIDI parsing and conversion helpers
│   │   ├── sample_utils.py           # Audio sample-related utilities (pitch detection, normalization)
│   │   ├── velocity_layer_manager.py # Assigns velocity layers to multi-samples
│   │   └── xpm_fixer.py              # Fixes XPM files (MPC drum kits/instruments)
│   │
│   ├── models/
│   │   ├── drumkit_model.py          # Defines schema for DrumKit-related data
│   │   └── instrument_model.py       # Defines schema for Instrument data (Keygroups)
│   │
│   ├── services/
│   │   ├── export_service.py         # Exports kits/instruments to MPC-compatible format
│   │   ├── preview_renderer.py       # Renders audio previews for kits/instruments
│   │   └── mapping_service.py        # Handles key/velocity/sample mapping logic
│   │
│   ├── endpoints/
│   │   ├── drumkit_routes.py         # API routes for DrumKit creation and export
│   │   ├── instrument_routes.py      # API routes for Keygroup instruments
│   │   └── file_upload_routes.py     # File upload and batch scan endpoints
│   │
│   └── tasks/
│       └── batch_processor.py        # Handles batch processing for automation or bulk operations
│
├── frontend/                         # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                   # Root app component
│   │   ├── main.jsx                  # Entry point
│   │   ├── index.css                 # Tailwind CSS styling
│   │   ├── assets/                   # Icons/images if needed
│   │   ├── components/
│   │   │   ├── DrumKitBuilder.jsx    # UI to assign pads, drag-and-drop, preview, and export drumkits
│   │   │   ├── InstrumentBuilder.jsx # UI to assign multisamples, edit zones, preview, and export instruments
│   │   │   ├── PadMatrix.jsx         # 4x4 pad grid (playable), color-coded by velocity/key zones
│   │   │   ├── ExportKit.jsx         # Export control panel: trigger export, choose format, fix XPMs
│   │   │   ├── FileDropZone.jsx      # Drag-and-drop file area, accepts folders/samples
│   │   │   ├── PreviewPanel.jsx      # Plays back preview audio
│   │   │   ├── VelocityEditor.jsx    # Manages mapping of velocity layers
│   │   │   └── Toolbar.jsx           # Theme toggle, module switching, global tools
│   │   └── hooks/
│   │       └── useSampleLoader.js    # Custom hook to load and analyze samples
│
├── requirements.txt                  # Python backend dependencies
├── tailwind.config.js                # Tailwind CSS config
├── postcss.config.js                 # PostCSS plugin config for Tailwind
├── vite.config.js                    # Vite dev server config
└── package.json                      # Node.js frontend dependencies & scripts

```
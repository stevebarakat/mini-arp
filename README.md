# 🎵 Web Audio Arpeggiator

A programmable music arpeggiator built with React, XState, TypeScript, and Tone.js. Create, sequence, and manipulate electronic music patterns with real-time audio effects.

## ✨ Features

### 🎹 **Sequencer Grid**

- 8-step sequencer with 4-note monophonic playback
- Visual grid interface for pattern creation
- Real-time step indicator
- Pattern editing with click-to-toggle functionality

### 🎛️ **Audio Controls**

- **Tempo Control**: Adjustable BPM from 60-200
- **Pitch Control**: Transpose sequences up to 2 octaves up/down
- **Root Note Selection**: Change the base note for your sequences

### 🎚️ **Audio Effects**

- **Auto Filter**: LFO-controlled filter with frequency, depth, and resonance controls
- **Delay**: Echo effect with time, feedback, and wet mix controls
- **Reverb**: Spatial effect with decay, pre-delay, and wet mix controls
- **Distortion**: Harmonic saturation with amount and wet mix controls

### 🎹 **Virtual Keyboard**

- Interactive keyboard interface
- Visual key mapping
- Real-time note playback
- MIDI-style interaction

### 🥁 **Rhythm Section**

- Hi-hat pattern sequencer
- 8-step rhythm programming
- Integrated with main sequencer

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sequencer-new
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to start creating music!

## 🎯 Usage Guide

### Creating Patterns

1. **Click on the sequencer grid** to toggle notes on/off
2. **Each row represents a different note** (B, G, E, C by default)
3. **Each column represents a step** in the 8-step sequence
4. **The highlighted column** shows the current playing position

### Controlling Playback

- **Play/Stop**: Use the main transport controls
- **Tempo**: Adjust the BPM slider (60-200 BPM)
- **Pitch**: Use the pitch control to transpose your sequence

### Adding Effects

1. **Open the Effects panel** to access audio effects
2. **Enable effects** using the toggle switches
3. **Adjust parameters** using the knobs and sliders:
   - **Filter**: Frequency, Depth, Resonance, Wet Mix
   - **Delay**: Time, Feedback, Wet Mix
   - **Reverb**: Decay, Pre-delay, Wet Mix
   - **Distortion**: Amount, Wet Mix

### Using the Keyboard

- **Click keys** to play individual notes
- **Visual feedback** shows active keys
- **Integrated** with the sequencer for live performance

## 🛠️ Technical Stack

### Core Technologies

- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tone.js** - Web Audio API wrapper
- **XState** - State management with state machines

### Audio Engine

- **Tone.js** for audio synthesis and processing
- **AMSynth** for melodic sounds
- **NoiseSynth** for percussion
- **Real-time audio effects** with Tone.js nodes

### State Management

- **XState** for complex state logic
- **State machines** for sequencer and effects
- **Reactive state updates** with selectors

### UI Components

- **Radix UI** for accessible components
- **CSS Modules** for scoped styling
- **Custom components** for audio controls

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── SequencerGrid/  # Main sequencer interface
│   ├── Keyboard/       # Virtual keyboard
│   ├── EffectsTabs/    # Audio effects panel
│   ├── TempoControl/   # Tempo adjustment
│   ├── PitchControl/   # Pitch transposition
│   └── ...            # Other UI components
├── machines/           # XState state machines
│   ├── sequencerMachine.ts
│   └── effectsMachine.ts
├── constants.ts        # Audio and UI constants
└── styles/            # Global styles
```

## 🎵 Audio Features

### Synthesis

- **AMSynth** for melodic content
- **NoiseSynth** for percussion
- **Configurable envelopes** and modulation
- **Monophonic playback** with note priority

### Effects Chain

- **Auto Filter**: LFO-controlled filter modulation
- **Delay**: Echo and feedback effects
- **Reverb**: Spatial and ambient effects
- **Distortion**: Harmonic saturation
- **Wet/Dry mixing** for all effects

### Audio Routing

- **Effects bus** for parallel processing
- **Individual effect channels** for precise control
- **Master limiter** for output protection
- **Real-time parameter updates**

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Splitting

- **Lazy-loaded components** for better performance
- **Suspense boundaries** for smooth loading
- **Optimized bundle** with Vite

## 🎨 Customization

### Audio Parameters

Modify `src/constants.ts` to adjust:

- **Synth configuration** (envelope, modulation)
- **Effect parameters** (ranges, defaults)
- **Sequencer settings** (steps, tempo range)

### UI Styling

- **CSS Modules** for component-specific styles
- **Global styles** in `src/styles/`
- **Responsive design** considerations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Tone.js** for the powerful audio engine
- **XState** for robust state management
- **Radix UI** for accessible components
- **Vite** for the excellent development experience

---

**Happy Sequencing! 🎵**

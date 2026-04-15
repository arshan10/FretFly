# 🦋 FretFly

**AI-Powered Guitar Practice Companion**

FretFly uses computer vision (MediaPipe Hands) and audio analysis (Web Audio API) to track your guitar practice, detect chords, analyze transitions, and provide real-time feedback on your technique.

## ✨ Features

### Dual-Mode Chord Detection
- **Vision Mode**: Uses MediaPipe Hands to track your fretting hand and detect chord shapes based on finger positions
- **Audio Mode**: Analyzes microphone input to detect chords from the frequencies you play
- **Combined**: Use both for more accurate detection

### Real-Time Hand Tracking
- 21-point hand landmark detection
- Visual overlay showing finger positions
- Live finger curl status (curled vs extended)
- Wrist angle monitoring for proper technique

### Guitar Tab Generation
- Automatically generates tab notation as you play
- Displays chord progressions in standard tab format
- Export tabs to text file for later reference

### Transition Analysis
- Tracks time between chord changes
- Rates transitions:
  - ⚡ Excellent: < 1 second
  - 👍 Good: 1-2 seconds
  - ⚠️ Needs Practice: > 2 seconds

### Practice Metrics
- **Accuracy**: Percentage of successful (fast) transitions
- **Transitions/min**: Speed of chord changes
- **Consistency**: Based on standard deviation of transition times
- **Session Time**: Total practice duration

### Data Persistence
- All session data saved to localStorage
- Export your progress and tabs
- No external database required

## 🚀 Quick Start

### Option 1: Python Server
```bash
cd guitar-analyzer
python3 server.py
# Open http://localhost:8000 in your browser
```

### Option 2: Direct File
Simply open `index.html` in a modern web browser.

### Option 3: Node.js Serve
```bash
npx serve .
# Open the displayed URL
```

## 📋 Requirements

- **Browser**: Chrome 90+, Edge 90+, Firefox 89+, Safari 14+
- **Camera**: Required for vision-based chord detection
- **Microphone**: Optional, for audio-based chord detection
- **Permissions**: Camera and optionally microphone access

## 🎯 How to Use

### 1. Start the Application
Open FretFly in your browser and click **Start** to begin.

### 2. Position Your Hand
- Position your **fretting hand** (left hand for right-handed players) in view of the camera
- Hold your guitar in normal playing position
- Ensure good lighting for best detection

### 3. Enable Audio (Optional)
Click **Enable Audio** to allow FretFly to also analyze the sounds you play for more accurate chord detection.

### 4. Play Chords
- Form chord shapes with your fretting hand
- Strum the strings
- Watch as FretFly detects your chords and generates tabs

### 5. Review Your Practice
- Check the **Practice Metrics** for your performance stats
- Review **Real-time Feedback** for technique tips
- Export your tabs when done

## 🎸 Supported Chords

FretFly can detect the following chords:

| Major | Minor |
|-------|-------|
| C | Am |
| D | Em |
| E | Dm |
| F | |
| G | |
| A | |
| B | |

## 🏗️ Architecture

```
FretFly/
├── index.html      # Main UI with modern dark theme
├── app.js          # Core application logic
│                   # - MediaPipe Hands integration
│                   # - Web Audio API analysis
│                   # - Chord detection algorithms
│                   # - Tab generation
│                   # - LocalStorage persistence
├── server.py       # Simple Python HTTP server
├── package.json    # Project metadata
└── README.md       # This file
```

## 🔧 Configuration

You can adjust settings in `app.js`:

```javascript
const CONFIG = {
    // MediaPipe settings
    modelComplexity: 0,        // 0=light, 1=balanced, 2=heavy
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.3,
    
    // Audio settings
    fftSize: 2048,
    smoothingTime: 0.8,
    
    // Chord definitions
    chordSignatures: { ... },
    chordTabs: { ... }
};
```

## 🛠️ Development

### Running Locally
```bash
# Using Python
python3 server.py

# Using Node.js
npx serve .

# Direct file access
open index.html
```

### Modifying Chord Detection
Add or modify chords in the `CONFIG.chordSignatures` and `CONFIG.chordTabs` objects in `app.js`.

### Adding Features
The codebase is modular with clear separation:
- Vision handling: `onVisionResults()`, `detectChordFromVision()`
- Audio handling: `analyzeAudio()`, `detectChordFromAudio()`
- UI updates: `updateChordDisplay()`, `updateMetrics()`, `addFeedback()`

## 📊 Data & Privacy

- **No external servers**: All processing happens in your browser
- **No data collection**: FretFly doesn't send any data anywhere
- **Local storage only**: Session data is saved to your browser's localStorage
- **Export your data**: Use the Export feature to download your tabs and metrics

## 🐛 Troubleshooting

### Hand Not Detected
- Ensure good lighting on your fretting hand
- Move your hand closer to the camera (30-60cm ideal)
- Make sure fingers are visible, not obscured by the guitar neck
- Try lowering the detection threshold in CONFIG if needed

### Audio Not Working
- Check browser permissions for microphone access
- Ensure no other application is using the microphone
- Try refreshing the page

### Chord Detection Inaccurate
- Make clear, distinct chord shapes
- For vision: Keep fingers properly curled on the fretboard
- For audio: Strum clearly and let chords ring out
- Enable both vision and audio for best results

### Performance Issues
- Close other browser tabs
- Lower the model complexity in CONFIG
- Reduce camera resolution (modify in `initializeApp()`)

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for the excellent hand tracking
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for audio analysis capabilities

---

**Happy Practicing! 🎵**

*FretFly - Your AI guitar practice companion*
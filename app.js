/**
 * FretFly - AI-Powered Guitar Practice Companion
 * 
 * Uses MediaPipe Hands for vision tracking and Web Audio API for
 * frequency analysis to detect guitar chords and provide practice feedback.
 */

// ==================== Configuration ====================
const CONFIG = {
    // MediaPipe settings - optimized for better detection
    modelComplexity: 0, // Lighter model for better performance
    minDetectionConfidence: 0.5, // Lowered for better detection
    minTrackingConfidence: 0.3, // Lowered for continuity
    
    // Analysis settings
    stabilityFrames: 15, // Reduced frames for faster detection
    transitionThreshold: 0.2,
    
    // Audio analysis settings
    sampleRate: 44100,
    fftSize: 2048,
    smoothingTime: 0.8,
    
    // Guitar tuning frequencies (standard EADGBE)
    guitarStrings: {
        'E2': 82.41,  // 6th string (low E)
        'A2': 110.00, // 5th string
        'D3': 146.83, // 4th string
        'G3': 196.00, // 3rd string
        'B3': 246.94, // 2nd string
        'E4': 329.63  // 1st string (high E)
    },
    
    // Chord frequency signatures (simplified - based on root notes and common voicings)
    chordSignatures: {
        'C':  { root: 130.81, type: 'major', strings: [0, 3, 2, 0, 1, 0] },
        'D':  { root: 146.83, type: 'major', strings: [-1, -1, 0, 2, 3, 2] },
        'E':  { root: 164.81, type: 'major', strings: [0, 2, 2, 1, 0, 0] },
        'F':  { root: 174.61, type: 'major', strings: [1, 3, 3, 2, 1, 1] },
        'G':  { root: 196.00, type: 'major', strings: [3, 2, 0, 0, 0, 3] },
        'A':  { root: 220.00, type: 'major', strings: [-1, 0, 2, 2, 2, 0] },
        'B':  { root: 246.94, type: 'major', strings: [-1, 2, 4, 4, 4, 2] },
        'Am': { root: 220.00, type: 'minor', strings: [-1, 0, 2, 2, 1, 0] },
        'Em': { root: 164.81, type: 'minor', strings: [0, 2, 2, 0, 0, 0] },
        'Dm': { root: 146.83, type: 'minor', strings: [-1, -1, 0, 2, 3, 1] },
    },
    
    // Chord tab representations
    chordTabs: {
        'C':  'x32010',
        'D':  'xx0232',
        'E':  '022100',
        'F':  '133211',
        'G':  '320003',
        'A':  'x02220',
        'B':  'x24442',
        'Am': 'x02210',
        'Em': '022000',
        'Dm': 'xx0231',
    }
};

// ==================== Application State ====================
const state = {
    isRunning: false,
    audioEnabled: false,
    currentChord: null,
    previousChord: null,
    chordStartTime: null,
    transitionStartTime: null,
    
    // Metrics
    metrics: {
        accuracy: 0,
        transitionsPerMinute: 0,
        consistency: 0,
        sessionTime: 0,
        totalTransitions: 0,
        successfulTransitions: 0,
        chordHistory: []
    },
    
    // Analysis
    handLandmarks: null,
    stabilityCount: 0,
    transitionTimes: [],
    
    // Audio
    audioContext: null,
    analyser: null,
    microphone: null,
    dataArray: null,
    detectedNotes: [],
    
    // Tabs
    tabHistory: [],
    
    // Session
    sessionStartTime: null,
    sessionId: null,
    
    // User Authentication
    user: null,
    authToken: null
};

// ==================== DOM Elements ====================
const elements = {};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    initializeApp();
    initAudioVisualizer();
    loadSessionData();
    checkAuthStatus();
});

function initializeElements() {
    const ids = [
        'webcam', 'output-canvas', 'start-btn', 'stop-btn', 'audio-btn', 'export-btn',
        'vision-status', 'vision-text', 'audio-status', 'audio-status-text',
        'chord-symbol', 'chord-name', 'detection-source', 'timer-value',
        'accuracy', 'speed', 'consistency', 'session-time',
        'feedback-list', 'tab-content', 'audio-visualizer',
        'auth-modal', 'login-form', 'register-form', 'chord-suggestions',
        'chord-diagrams', 'user-info'
    ];
    
    ids.forEach(id => {
        elements[id] = document.getElementById(id);
    });
    
    elements.canvasCtx = elements['output-canvas'].getContext('2d');
    
    // Setup auth event listeners
    setupAuthEvents();
}

function setupAuthEvents() {
    // Auth buttons
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if (registerBtn) registerBtn.addEventListener('click', showRegisterModal);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    // Close modal
    const closeModal = document.getElementById('close-modal');
    if (closeModal) closeModal.addEventListener('click', hideAuthModal);
}

// ==================== Authentication ====================
async function checkAuthStatus() {
    const token = localStorage.getItem('fretfly_token');
    if (token) {
        state.authToken = token;
        try {
            const response = await fetch('/api/sessions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                state.user = JSON.parse(localStorage.getItem('fretfly_user'));
                updateAuthUI(true);
            } else {
                localStorage.removeItem('fretfly_token');
                localStorage.removeItem('fretfly_user');
                updateAuthUI(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            updateAuthUI(false);
        }
    }
}

function updateAuthUI(isLoggedIn) {
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    
    if (authButtons) authButtons.style.display = isLoggedIn ? 'none' : 'flex';
    if (userInfo) {
        userInfo.style.display = isLoggedIn ? 'flex' : 'none';
        if (isLoggedIn && state.user) {
            userInfo.innerHTML = `
                <span>Welcome, ${state.user.username}!</span>
                <button class="btn btn-danger" id="logout-btn">Logout</button>
            `;
            document.getElementById('logout-btn').addEventListener('click', logout);
        }
    }
}

function showLoginModal() {
    elements['auth-modal'].style.display = 'block';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function showRegisterModal() {
    elements['auth-modal'].style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function hideAuthModal() {
    elements['auth-modal'].style.display = 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            state.authToken = data.token;
            state.user = data.user;
            localStorage.setItem('fretfly_token', data.token);
            localStorage.setItem('fretfly_user', JSON.stringify(data.user));
            hideAuthModal();
            updateAuthUI(true);
            addFeedback('good', 'Login successful!');
        } else {
            addFeedback('bad', data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        addFeedback('bad', 'Network error during login');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addFeedback('good', 'Registration successful! Please login.');
            showLoginModal();
        } else {
            addFeedback('bad', data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        addFeedback('bad', 'Network error during registration');
    }
}

function logout() {
    state.authToken = null;
    state.user = null;
    localStorage.removeItem('fretfly_token');
    localStorage.removeItem('fretfly_user');
    updateAuthUI(false);
    addFeedback('info', 'Logged out successfully');
}

// ==================== Backend Integration ====================
async function saveSessionToBackend() {
    if (!state.authToken || !state.user) return;
    
    try {
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({
                metrics: state.metrics,
                tabHistory: state.tabHistory,
                chordHistory: state.metrics.chordHistory
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addFeedback('good', 'Session saved to cloud!');
        } else {
            console.error('Backend save failed:', data.error);
        }
    } catch (error) {
        console.error('Backend save error:', error);
    }
}

async function loadChordSuggestions(chordName) {
    if (!state.authToken) return;
    
    try {
        const response = await fetch(`/api/chord-suggestions/${chordName}`, {
            headers: {
                'Authorization': `Bearer ${state.authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayChordSuggestions(data);
        }
    } catch (error) {
        console.error('Chord suggestions error:', error);
    }
}

async function loadChordDiagram(chordName) {
    if (!state.authToken) return;
    
    try {
        const response = await fetch(`/api/chord-diagrams/${chordName}`, {
            headers: {
                'Authorization': `Bearer ${state.authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayChordDiagram(data);
        }
    } catch (error) {
        console.error('Chord diagram error:', error);
    }
}

function displayChordSuggestions(data) {
    const container = elements['chord-suggestions'];
    if (!container) return;
    
    container.innerHTML = `
        <h4>🎵 Suggested Next Chords</h4>
        <div class="suggestions-grid">
            ${data.circleOfFifths.map(chord => `
                <button class="btn btn-secondary suggestion-btn" onclick="loadChordDiagram('${chord}')">
                    ${chord}
                </button>
            `).join('')}
        </div>
        <div style="margin-top: 10px; font-size: 0.8rem; color: #64748b;">
            ${data.explanation}
        </div>
    `;
}

function displayChordDiagram(data) {
    const container = elements['chord-diagrams'];
    if (!container) return;
    
    container.innerHTML = `
        <h4>🎸 ${data.chord} Chord</h4>
        <div class="chord-info">
            <div class="chord-tab">${data.diagram}</div>
            <p>${data.description}</p>
            <h5>Tutorial Videos:</h5>
            ${data.tutorialVideos.map(video => `
                <div class="video-link">
                    <a href="${video.url}" target="_blank">${video.title}</a>
                    <span>(${video.duration})</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ==================== Initialization (Updated) ====================
async function initializeApp() {
    updateVisionStatus('loading', 'Loading MediaPipe...');
    
    try {
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: CONFIG.modelComplexity,
            minDetectionConfidence: CONFIG.minDetectionConfidence,
            minTrackingConfidence: CONFIG.minTrackingConfidence
        });

        hands.onResults(onVisionResults);

        window.hands = hands;

        const camera = new Camera(elements.webcam, {
            onFrame: async () => {
                if (state.isRunning) {
                    await window.hands.send({ image: elements.webcam });
                }
            },
            width: 640,
            height: 480
        });

        window.camera = camera;

        // Button handlers
        elements['start-btn'].addEventListener('click', startAnalysis);
        elements['stop-btn'].addEventListener('click', stopAnalysis);
        elements['audio-btn'].addEventListener('click', toggleAudio);
        elements['export-btn'].addEventListener('click', exportTabs);

        startMetricsTimer();
        
        updateVisionStatus('ready', 'Ready to start');
        elements['start-btn'].disabled = false;
        addFeedback('info', 'FretFly is ready! Click Start to begin.');

    } catch (error) {
        console.error('Failed to initialize MediaPipe:', error);
        updateVisionStatus('error', 'Failed to load MediaPipe');
    }
}

// ==================== Camera & Analysis Control (Updated) ====================
async function startAnalysis() {
    try {
        await window.camera.start();
        state.isRunning = true;
        state.sessionStartTime = Date.now();
        state.sessionId = 'session_' + new Date().toISOString().slice(0, 10);
        
        elements['start-btn'].disabled = true;
        elements['stop-btn'].disabled = false;
        
        updateVisionStatus('active', 'Vision active');
        addFeedback('good', 'Analysis started - show your fretting hand');
        
        saveSessionData();

    } catch (error) {
        console.error('Failed to start camera:', error);
        updateVisionStatus('error', 'Camera access denied');
        addFeedback('bad', 'Please allow camera access');
    }
}

function stopAnalysis() {
    state.isRunning = false;
    if (window.camera && window.camera.stop) {
        window.camera.stop();
    }
    
    elements['start-btn'].disabled = false;
    elements['stop-btn'].disabled = true;
    
    updateVisionStatus('ready', 'Stopped');
    addFeedback('info', `Session complete! ${state.metrics.totalTransitions} transitions recorded.`);
    
    // Clear canvas
    elements.canvasCtx.clearRect(0, 0, elements['output-canvas'].width, elements['output-canvas'].height);
    
    saveSessionData();
    
    // Save to backend if authenticated
    if (state.authToken) {
        saveSessionToBackend();
    }
}

// ==================== Vision Results Handler (Updated) ====================
function onVisionResults(results) {
    // Resize canvas
    elements['output-canvas'].width = elements.webcam.videoWidth;
    elements['output-canvas'].height = elements.webcam.videoHeight;
    
    // Clear canvas
    elements.canvasCtx.clearRect(0, 0, elements['output-canvas'].width, elements['output-canvas'].height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        state.handLandmarks = landmarks;
        
        // Draw landmarks
        drawLandmarks(landmarks);
        
        // Detect chord from hand position
        const chord = detectChordFromVision(landmarks);
        processVisionChordDetection(chord);
        
    } else {
        state.handLandmarks = null;
        
        // Only show "no hand" if audio also isn't detecting anything
        if (!state.audioEnabled) {
            updateChordDisplay('--', 'No hand detected', null);
        }
    }
}

// ==================== Chord Detection (Updated) ====================
function processVisionChordDetection(chord) {
    if (!chord) return;
    
    // Stability check
    if (state.currentChord && state.currentChord.name === chord.name) {
        state.stabilityCount++;
        
        if (state.stabilityCount >= CONFIG.stabilityFrames) {
            if (!state.chordStartTime) {
                state.chordStartTime = Date.now();
            }
            
            const holdTime = (Date.now() - state.chordStartTime) / 1000;
            updateChordDisplay(chord.name, getChordFullName(chord.name), 'vision');
            updateTimer(holdTime);
            
            // Check posture
            checkPosture(chord);
            
            // Load chord suggestions and diagrams
            loadChordSuggestions(chord.name);
            loadChordDiagram(chord.name);
        }
    } else {
        // New chord
        if (state.currentChord && state.stabilityCount >= CONFIG.stabilityFrames) {
            recordTransition(state.currentChord.name, chord.name);
        }
        
        state.previousChord = state.currentChord;
        state.currentChord = chord;
        state.stabilityCount = 1;
        state.chordStartTime = null;
        state.transitionStartTime = Date.now();
        
        updateChordDisplay(chord.name, getChordFullName(chord.name), 'vision');
        addToTabHistory(chord.name);
        addFeedback('info', `Detected: ${getChordFullName(chord.name)}`);
        
        // Load chord suggestions and diagrams for new chord
        loadChordSuggestions(chord.name);
        loadChordDiagram(chord.name);
    }
}

// ==================== Audio Analysis (Updated) ====================
function processAudioChordDetection(chordName) {
    // Audio detection is less stable, so we use it to supplement vision
    if (state.currentChord && state.currentChord.name === chordName) {
        return; // Already detected
    }
    
    // Only use audio detection if vision isn't providing confident results
    const chord = {
        name: chordName,
        data: CONFIG.chordSignatures[chordName],
        confidence: 0.7,
        source: 'audio'
    };
    
    // Process similarly to vision detection but with lower priority
    if (!state.currentChord || state.metrics.totalTransitions === 0) {
        updateChordDisplay(chord.name, getChordFullName(chord.name), 'audio');
        addToTabHistory(chord.name);
        
        // Load chord suggestions and diagrams
        loadChordSuggestions(chord.name);
        loadChordDiagram(chord.name);
    }
}

// ==================== Tab Generation (Updated) ====================
function addToTabHistory(chordName) {
    const tab = CONFIG.chordTabs[chordName];
    if (!tab) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const tabEntry = {
        chord: chordName,
        tab: tab,
        time: timestamp
    };
    
    state.tabHistory.push(tabEntry);
    
    // Keep last 50 entries
    if (state.tabHistory.length > 50) {
        state.tabHistory.shift();
    }
    
    updateTabDisplay();
    
    // Add to chord history for backend
    state.metrics.chordHistory.push({
        chord: chordName,
        timestamp: new Date().toISOString()
    });
}

// ==================== UI Updates (Updated) ====================
function updateChordDisplay(symbol, name, source) {
    elements['chord-symbol'].textContent = symbol;
    elements['chord-name'].textContent = name;
    
    const sourceEl = elements['detection-source'];
    sourceEl.textContent = source ? `${source.toUpperCase()} detection` : 'No detection';
    sourceEl.className = 'detection-source';
    if (source) {
        sourceEl.classList.add(source);
    }
}

// ==================== Utility Functions (Updated) ====================
function getChordFullName(chordName) {
    const names = {
        'C': 'C Major', 'D': 'D Major', 'E': 'E Major', 'F': 'F Major',
        'G': 'G Major', 'A': 'A Major', 'B': 'B Major',
        'Am': 'A Minor', 'Em': 'E Minor', 'Dm': 'D Minor'
    };
    return names[chordName] || chordName;
}

// ==================== LocalStorage Persistence (Updated) ====================
function saveSessionData() {
    const data = {
        metrics: state.metrics,
        tabHistory: state.tabHistory,
        sessionTime: state.sessionStartTime,
        transitionTimes: state.metrics.transitionTimes,
        user: state.user
    };
    
    try {
        localStorage.setItem('fretfly_session', JSON.stringify(data));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadSessionData() {
    try {
        const saved = localStorage.getItem('fretfly_session');
        if (saved) {
            const data = JSON.parse(saved);
            // Restore metrics but not active state
            if (data.metrics) {
                state.metrics = data.metrics;
                updateMetrics();
            }
            if (data.tabHistory) {
                state.tabHistory = data.tabHistory;
                updateTabDisplay();
            }
            console.log('Previous session data loaded');
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}

// ==================== Audio Analysis ====================
async function initAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = CONFIG.fftSize;
    state.analyser.smoothingTimeConstant = CONFIG.smoothingTimeConstant;
    
    state.microphone = state.audioContext.createMediaStreamSource(stream);
    state.microphone.connect(state.analyser);
    
    const bufferLength = state.analyser.frequencyBinCount;
    state.dataArray = new Uint8Array(bufferLength);
    
    // Start audio analysis loop
    analyzeAudio();
}

function analyzeAudio() {
    if (!state.audioEnabled || !state.analyser) return;
    
    state.analyser.getByteFrequencyData(state.dataArray);
    
    // Update visualizer
    updateAudioVisualizer(state.dataArray);
    
    // Detect chord from audio
    const detectedChord = detectChordFromAudio(state.dataArray);
    
    if (detectedChord) {
        processAudioChordDetection(detectedChord);
    }
    
    requestAnimationFrame(analyzeAudio);
}

function detectChordFromAudio(dataArray) {
    // Get the frequency spectrum
    const nyquist = CONFIG.sampleRate / 2;
    const step = nyquist / (CONFIG.fftSize / 2);
    
    // Find peaks in the frequency spectrum
    const peaks = [];
    const threshold = 100; // Minimum amplitude
    
    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > threshold) {
            const freq = i * step;
            // Only consider guitar range (80Hz - 1000Hz)
            if (freq >= 80 && freq <= 1000) {
                peaks.push({ freq, amplitude: dataArray[i] });
            }
        }
    }
    
    if (peaks.length < 2) return null;
    
    // Sort by amplitude
    peaks.sort((a, b) => b.amplitude - a.amplitude);
    
    // Get the strongest frequencies
    const topPeaks = peaks.slice(0, 6);
    
    // Try to match to known chord signatures
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [chordName, signature] of Object.entries(CONFIG.chordSignatures)) {
        let score = 0;
        
        for (const peak of topPeaks) {
            // Check if this frequency matches any note in the chord
            for (let string = 0; string < 6; string++) {
                if (signature.strings[string] >= 0) {
                    // Calculate expected frequency for this string at this fret
                    const baseFreq = Object.values(CONFIG.guitarStrings)[string];
                    const expectedFreq = baseFreq * Math.pow(2, signature.strings[string] / 12);
                    
                    // Allow 5% tolerance
                    if (Math.abs(peak.freq - expectedFreq) / expectedFreq < 0.05) {
                        score++;
                    }
                }
            }
        }
        
        // Also check if root note is present
        if (topPeaks.some(p => Math.abs(p.freq - signature.root) / signature.root < 0.05)) {
            score += 2;
        }
        
        if (score > bestScore && score >= 3) {
            bestScore = score;
            bestMatch = chordName;
        }
    }
    
    return bestMatch;
}

function initAudioVisualizer() {
    const container = elements['audio-visualizer'];
    for (let i = 0; i < 32; i++) {
        const bar = document.createElement('div');
        bar.className = 'audio-bar';
        bar.style.height = '2px';
        container.appendChild(bar);
    }
}

function updateAudioVisualizer(dataArray) {
    const bars = elements['audio-visualizer'].children;
    const step = Math.floor(dataArray.length / bars.length);
    
    for (let i = 0; i < bars.length; i++) {
        const value = dataArray[i * step];
        const height = Math.max(2, (value / 255) * 40);
        bars[i].style.height = `${height}px`;
    }
}

// ==================== Drawing Functions ====================
function drawLandmarks(landmarks) {
    // Draw connections
    drawConnectors(elements.canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: '#10b981',
        lineWidth: 2
    });
    
    // Draw landmarks
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * elements['output-canvas'].width;
        const y = landmarks[i].y * elements['output-canvas'].height;
        
        let color = '#ef4444';
        let radius = 4;
        
        // Fingertips
        if ([8, 12, 16, 20].includes(i)) {
            color = '#f59e0b';
            radius = 7;
        }
        
        // Wrist
        if (i === 0) {
            color = '#06b6d4';
            radius = 6;
        }
        
        drawLandmark(elements.canvasCtx, landmarks[i], { color, radius });
    }
    
    // Draw finger status
    drawFingerStatus(landmarks);
}

function drawFingerStatus(landmarks) {
    const fingerNames = ['Index', 'Middle', 'Ring', 'Pinky'];
    const fingertipIndices = [8, 12, 16, 20];
    const pipIndices = [6, 10, 14, 18];
    
    elements.canvasCtx.font = '14px Arial';
    elements.canvasCtx.fillStyle = 'white';
    
    for (let i = 0; i < 4; i++) {
        const isCurled = isFingerCurled(landmarks, fingertipIndices[i], pipIndices[i]);
        const color = isCurled ? '#10b981' : '#ef4444';
        const status = isCurled ? '●' : '○';
        
        elements.canvasCtx.fillStyle = color;
        elements.canvasCtx.fillText(`${fingerNames[i]}: ${status}`, 10, 30 + i * 22);
    }
}

// ==================== Hand Analysis ====================
function isFingerCurled(landmarks, tipIndex, pipIndex) {
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];
    const wrist = landmarks[0];
    
    const wristToTip = Math.sqrt(
        Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2)
    );
    const wristToPip = Math.sqrt(
        Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2)
    );
    
    return wristToTip < wristToPip * 0.95;
}

function calculateWristAngle(landmarks) {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    
    return Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
}

// ==================== Chord Detection (Vision) ====================
function detectChordFromVision(landmarks) {
    const fingertipIndices = [8, 12, 16, 20];
    const pipIndices = [6, 10, 14, 18];
    
    const fingerPattern = fingertipIndices.map((tip, i) => 
        isFingerCurled(landmarks, tip, pipIndices[i]) ? 1 : 0
    );
    
    const wristAngle = calculateWristAngle(landmarks);
    
    // Match against known chord patterns
    const patterns = {
        'C': [1, 1, 1, 0],
        'G': [1, 1, 1, 1],
        'D': [1, 1, 0, 0],
        'A': [1, 1, 1, 0],
        'E': [1, 1, 1, 0],
        'Am': [1, 1, 1, 0],
        'Em': [1, 1, 0, 0],
        'Dm': [1, 1, 1, 0],
        'F': [1, 1, 0, 0]
    };
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [chordName, pattern] of Object.entries(patterns)) {
        let score = 0;
        
        for (let i = 0; i < 4; i++) {
            if (fingerPattern[i] === pattern[i]) score++;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = chordName;
        }
    }
    
    if (bestScore >= 3) {
        return {
            name: bestMatch,
            data: CONFIG.chordSignatures[bestMatch],
            confidence: bestScore / 4,
            fingerPattern,
            wristAngle,
            source: 'vision'
        };
    }
    
    return null;
}

// ==================== Transition Analysis ====================
function recordTransition(fromChord, toChord) {
    if (!state.transitionStartTime) return;
    
    const transitionTime = (Date.now() - state.transitionStartTime) / 1000;
    state.metrics.totalTransitions++;
    
    if (transitionTime < 2.0) {
        state.metrics.successfulTransitions++;
    }
    
    state.metrics.transitionTimes.push(transitionTime);
    if (state.metrics.transitionTimes.length > 20) {
        state.metrics.transitionTimes.shift();
    }
    
    updateMetrics();
    
    // Feedback
    if (transitionTime < 1.0) {
        addFeedback('good', `⚡ Excellent: ${fromChord} → ${toChord} (${transitionTime.toFixed(2)}s)`);
    } else if (transitionTime < 2.0) {
        addFeedback('info', `👍 Good: ${fromChord} → ${toChord} (${transitionTime.toFixed(2)}s)`);
    } else {
        addFeedback('warning', `⚠ Slow: ${fromChord} → ${toChord} (${transitionTime.toFixed(2)}s)`);
    }
    
    saveSessionData();
}

function checkPosture(chord) {
    if (chord.wristAngle < 140) {
        addFeedback('bad', 'Wrist too bent - straighten for better technique');
    } else if (chord.wristAngle > 200) {
        addFeedback('bad', 'Wrist over-extended - relax your hand');
    }
}

// ==================== Tab Generation ====================
function updateTabDisplay() {
    if (state.tabHistory.length === 0) {
        elements['tab-content'].innerHTML = '<span style="color: #475569;">Start playing to see tabs...</span>';
        return;
    }
    
    const strings = ['e|', 'B|', 'G|', 'D|', 'A|', 'E|'];
    let output = '';
    
    // Show last 10 chord changes
    const recentTabs = state.tabHistory.slice(-10);
    
    for (let i = 0; i < 6; i++) {
        output += strings[i];
        for (const entry of recentTabs) {
            const fretNum = entry.tab[i];
            output += '--' + fretNum + '--';
        }
        output += '\n';
    }
    
    // Add chord names below
    output += '   ';
    for (const entry of recentTabs) {
        output += '  ' + entry.chord + '  ';
    }
    
    elements['tab-content'].innerHTML = output;
}

function exportTabs() {
    if (state.tabHistory.length === 0) {
        addFeedback('warning', 'No tabs to export');
        return;
    }
    
    let exportText = 'FretFly Session Export\n';
    exportText += '=====================\n\n';
    exportText += `Date: ${new Date().toLocaleString()}\n`;
    exportText += `Total Transitions: ${state.metrics.totalTransitions}\n`;
    exportText += `Accuracy: ${state.metrics.accuracy}%\n\n`;
    exportText += 'Chord Progression:\n';
    exportText += '-----------------\n';
    
    state.tabHistory.forEach((entry, i) => {
        exportText += `${i + 1}. ${entry.chord} (${entry.tab}) - ${entry.time}\n`;
    });
    
    // Download
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fretfly-tabs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    addFeedback('good', 'Tabs exported successfully!');
}

// ==================== UI Updates ====================
function updateTimer(seconds) {
    elements['timer-value'].textContent = `${seconds.toFixed(2)}s`;
}

function updateMetrics() {
    if (state.metrics.totalTransitions > 0) {
        state.metrics.accuracy = Math.round(
            (state.metrics.successfulTransitions / state.metrics.totalTransitions) * 100
        );
    }
    
    const sessionMinutes = (Date.now() - state.sessionStartTime) / 60000;
    if (sessionMinutes > 0) {
        state.metrics.transitionsPerMinute = Math.round(
            state.metrics.totalTransitions / sessionMinutes
        );
    }
    
    if (state.metrics.transitionTimes.length > 1) {
        const avg = state.metrics.transitionTimes.reduce((a, b) => a + b, 0) / 
                    state.metrics.transitionTimes.length;
        const variance = state.metrics.transitionTimes.reduce((a, b) => 
            a + Math.pow(b - avg, 2), 0) / state.metrics.transitionTimes.length;
        const stdDev = Math.sqrt(variance);
        state.metrics.consistency = Math.max(0, Math.round(100 - (stdDev * 50)));
    }
    
    elements['accuracy'].textContent = `${state.metrics.accuracy}%`;
    elements['speed'].textContent = state.metrics.transitionsPerMinute;
    elements['consistency'].textContent = `${state.metrics.consistency}%`;
}

function updateVisionStatus(status, text) {
    elements['vision-text'].textContent = text;
    const dot = elements['vision-status'];
    dot.className = 'status-dot';
    
    if (status === 'active') dot.classList.add('active');
    else if (status === 'error') dot.style.background = '#ef4444';
    else if (status === 'ready') dot.style.background = '#10b981';
    else if (status === 'loading') dot.style.background = '#f59e0b';
}

function addFeedback(type, message) {
    const list = elements['feedback-list'];
    
    // Remove loading if present
    const loading = list.querySelector('.loading');
    if (loading) loading.remove();
    
    const item = document.createElement('div');
    item.className = `feedback-item feedback-${type}`;
    item.innerHTML = `<span>${message}</span>`;
    
    list.insertBefore(item, list.firstChild);
    
    // Limit to 10 items
    while (list.children.length > 10) {
        list.removeChild(list.lastChild);
    }
}

function startMetricsTimer() {
    setInterval(() => {
        if (state.isRunning && state.sessionStartTime) {
            const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            elements['session-time'].textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            updateMetrics();
        }
    }, 1000);
}

// ==================== Audio Control ====================
async function toggleAudio() {
    if (!state.audioEnabled) {
        try {
            await initAudio();
            state.audioEnabled = true;
            elements['audio-btn'].classList.remove('btn-success');
            elements['audio-btn'].classList.add('btn-primary');
            elements['audio-btn'].innerHTML = '<span>🎤</span> Audio On';
            document.getElementById('audio-status').classList.add('audio-active');
            document.getElementById('audio-status-text').textContent = 'Listening...';
            addFeedback('good', 'Audio analysis enabled');
        } catch (error) {
            console.error('Audio init failed:', error);
            addFeedback('bad', 'Microphone access denied');
        }
    } else {
        if (state.analyser) {
            state.analyser.disconnect();
        }
        state.audioEnabled = false;
        elements['audio-btn'].classList.remove('btn-primary');
        elements['audio-btn'].classList.add('btn-success');
        elements['audio-btn'].innerHTML = '<span>🎤</span> Enable Audio';
        document.getElementById('audio-status').classList.remove('audio-active');
        document.getElementById('audio-status-text').textContent = 'Microphone off';
        addFeedback('info', 'Audio analysis disabled');
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (elements.webcam.videoWidth) {
        elements['output-canvas'].width = elements.webcam.videoWidth;
        elements['output-canvas'].height = elements.webcam.videoHeight;
    }
});
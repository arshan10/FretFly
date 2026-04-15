const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/fretfly',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insert user
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Save practice session
app.post('/api/sessions', authenticateToken, async (req, res) => {
    try {
        const { metrics, tabHistory, chordHistory } = req.body;
        const userId = req.user.userId;
        
        const result = await pool.query(
            `INSERT INTO practice_sessions 
             (user_id, metrics, tab_history, chord_history, created_at) 
             VALUES ($1, $2, $3, $4, NOW()) 
             RETURNING id, created_at`,
            [userId, JSON.stringify(metrics), JSON.stringify(tabHistory), JSON.stringify(chordHistory)]
        );
        
        res.json({
            message: 'Session saved successfully',
            sessionId: result.rows[0].id
        });
    } catch (error) {
        console.error('Save session error:', error);
        res.status(500).json({ error: 'Failed to save session' });
    }
});

// Get user sessions
app.get('/api/sessions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await pool.query(
            `SELECT id, metrics, tab_history, chord_history, created_at 
             FROM practice_sessions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get chord suggestions based on music theory
app.get('/api/chord-suggestions/:currentChord', authenticateToken, (req, res) => {
    const currentChord = req.params.currentChord;
    const suggestions = getChordSuggestions(currentChord);
    res.json(suggestions);
});

// Get chord diagrams from external API
app.get('/api/chord-diagrams/:chordName', authenticateToken, async (req, res) => {
    const chordName = req.params.chordName;
    
    try {
        // Mock chord diagram data - in real implementation, this would call external APIs
        const chordData = {
            chord: chordName,
            diagram: getChordDiagram(chordName),
            tutorialVideos: getTutorialVideos(chordName),
            description: getChordDescription(chordName)
        };
        
        res.json(chordData);
    } catch (error) {
        console.error('Chord diagram error:', error);
        res.status(500).json({ error: 'Failed to fetch chord diagram' });
    }
});

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Music Theory: Circle of Fifths and Chord Progressions
function getChordSuggestions(currentChord) {
    // Circle of Fifths relationships
    const circleOfFifths = {
        'C': ['G', 'F', 'Am', 'Em'],
        'G': ['D', 'C', 'Em', 'Bm'],
        'D': ['A', 'G', 'Bm', 'F#m'],
        'A': ['E', 'D', 'F#m', 'C#m'],
        'E': ['B', 'A', 'C#m', 'G#m'],
        'B': ['F#', 'E', 'G#m', 'D#m'],
        'F#': ['C#', 'B', 'D#m', 'A#m'],
        'C#': ['G#', 'F#', 'A#m', 'Fm'],
        'G#': ['D#', 'C#', 'Fm', 'Cm'],
        'D#': ['A#', 'G#', 'Cm', 'Gm'],
        'A#': ['F', 'D#', 'Gm', 'Dm'],
        'F': ['C', 'A#', 'Dm', 'Am'],
        
        // Minor chords
        'Am': ['Em', 'F', 'C', 'Dm'],
        'Em': ['Bm', 'Am', 'G', 'C'],
        'Bm': ['F#m', 'Em', 'D', 'G'],
        'F#m': ['C#m', 'Bm', 'A', 'D'],
        'C#m': ['G#m', 'F#m', 'E', 'A'],
        'G#m': ['D#m', 'C#m', 'B', 'E'],
        'D#m': ['A#m', 'G#m', 'F#', 'B'],
        'A#m': ['Fm', 'D#m', 'C#', 'F#'],
        'Fm': ['Cm', 'A#m', 'G#', 'C#'],
        'Cm': ['Gm', 'Fm', 'D#', 'G#'],
        'Gm': ['Dm', 'Cm', 'A#', 'D#'],
        'Dm': ['Am', 'Gm', 'F', 'A#']
    };
    
    // Common chord progressions
    const progressions = {
        'pop': ['I', 'V', 'vi', 'IV'],
        'blues': ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'],
        'classical': ['I', 'IV', 'V', 'I'],
        'folk': ['I', 'IV', 'V', 'vi']
    };
    
    return {
        circleOfFifths: circleOfFifths[currentChord] || [],
        commonProgressions: progressions,
        explanation: "Based on music theory and the Circle of Fifths"
    };
}

function getChordDiagram(chordName) {
    // Mock chord diagrams - would integrate with real chord diagram APIs
    const diagrams = {
        'C': 'x32010',
        'G': '320003',
        'D': 'xx0232',
        'Am': 'x02210',
        'Em': '022000',
        'F': '133211'
    };
    
    return diagrams[chordName] || 'Diagram not available';
}

function getTutorialVideos(chordName) {
    // Mock tutorial data - would integrate with YouTube API
    return [
        {
            title: `${chordName} Chord Tutorial`,
            url: `https://youtube.com/results?search_query=${chordName}+guitar+tutorial`,
            duration: '3:45'
        },
        {
            title: `How to Play ${chordName} for Beginners`,
            url: `https://youtube.com/results?search_query=${chordName}+guitar+beginner`,
            duration: '5:12'
        }
    ];
}

function getChordDescription(chordName) {
    const descriptions = {
        'C': 'C Major - The foundation chord, often used in countless songs across all genres.',
        'G': 'G Major - Bright and uplifting, commonly used in folk and pop music.',
        'D': 'D Major - Energetic and bright, popular in rock and country music.',
        'Am': 'A Minor - The relative minor of C Major, often used for emotional depth.',
        'Em': 'E Minor - Simple and melancholic, great for ballads and introspective songs.',
        'F': 'F Major - More challenging due to the barre, but essential for many progressions.'
    };
    
    return descriptions[chordName] || 'Chord description not available';
}

// Create tables if they don't exist
async function createTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS practice_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                metrics JSONB NOT NULL,
                tab_history JSONB NOT NULL,
                chord_history JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await createTables();
});

module.exports = app;
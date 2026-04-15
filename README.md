# 🦋 FretFly

**AI-Powered Guitar Practice Companion**

A full-stack web application that uses computer vision (MediaPipe Hands) and audio analysis (Web Audio API) to track your guitar practice, detect chords, analyze transitions, and provide real-time feedback on your technique.

## ✨ Features

### Dual-Mode Chord Detection
- **Vision Mode**: Uses MediaPipe Hands to track your fretting hand
- **Audio Mode**: Analyzes microphone input for frequency-based detection
- **Combined**: Use both for maximum accuracy

### Full-Stack Architecture
- **Frontend**: Vanilla JavaScript with MediaPipe integration
- **Backend**: Node.js + Express API
- **Database**: PostgreSQL with SQL for user accounts and session storage
- **Authentication**: JWT-based user authentication

### Guitar Tab Generation
- Auto-generates tab notation as you play
- Export tabs to text file

### Music Theory Integration
- **Circle of Fifths** chord suggestions
- Common progression patterns (pop, blues, classical, folk)
- Suggested next chords based on current chord

### Practice Metrics
- Accuracy, transitions/min, consistency scores
- Session time tracking
- Cloud sync for authenticated users

## 🏗️ Tech Stack

### Frontend
- Vanilla JavaScript
- MediaPipe Hands (Computer Vision)
- Web Audio API
- HTML5 Canvas

### Backend
- Node.js + Express
- PostgreSQL (SQL Database)
- JWT Authentication
- bcrypt for password hashing

### Popular Job Market Technologies Used:
- **Node.js** - Most popular backend runtime
- **PostgreSQL** - #1 SQL database (used by Uber, Instagram, etc.)
- **Express.js** - Most popular Node.js framework
- **React** (optional - can be added)
- **JWT** - Industry standard for authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Modern browser with WebRTC support

### 1. Clone the Repository
```bash
git clone git@github.com:arshan10/FretFly.git
cd FretFly
```

### 2. Set Up PostgreSQL Database
```bash
# Create database
createdb fretfly

# Or using psql
psql -U postgres
CREATE DATABASE fretfly;
\q
```

### 3. Configure Backend
```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor
```

### 4. Install Dependencies
```bash
# Backend
cd backend
npm install

# Return to root
cd ..
```

### 5. Start the Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### 6. Start the Frontend
```bash
# Option 1: Python server
python3 server.py

# Option 2: Direct file access
open index.html

# Option 3: npx serve
npx serve .
```

## 📁 Project Structure

```
FretFly/
├── index.html              # Main frontend UI
├── app.js                  # Frontend JavaScript
├── package.json            # Frontend package config
├── server.py               # Simple Python server
├── README.md               # This file
│
├── backend/                # Node.js + PostgreSQL backend
│   ├── server.js           # Express API server
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment template
│
└── .gitignore              # Git ignore file
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Practice Sessions Table
```sql
CREATE TABLE practice_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    metrics JSONB NOT NULL,
    tab_history JSONB NOT NULL,
    chord_history JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | User login |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get user's practice sessions |
| POST | `/api/sessions` | Save practice session |

### Chord Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chord-suggestions/:chord` | Get chord suggestions |
| GET | `/api/chord-diagrams/:chord` | Get chord diagram |

## 🎸 Music Theory: Circle of Fifths

The Circle of Fifths is a music theory concept that shows relationships between chords. FretFly uses this to suggest chords that sound good together:

```
        C
    G       F
  D           Bb
A               Eb
  E           Ab
    B       F#
        F#
```

Common progressions:
- **Pop**: I - V - vi - IV (C - G - Am - F)
- **Blues**: I - I - I - I - IV - IV - I - I - V - IV - I - I
- **Classical**: I - IV - V - I
- **Folk**: I - IV - V - vi

## 📊 SQL vs NoSQL

### SQL (PostgreSQL) - Used in FretFly
- Structured data with relationships
- ACID compliance for data integrity
- Complex queries with JOINs
- Used by: Instagram, Uber, Spotify

### NoSQL (MongoDB)
- Flexible schema
- Horizontal scaling
- Document-based storage
- Used by: Netflix, Airbnb, eBay

**Why PostgreSQL for FretFly?**
- User data has clear relationships (users → sessions)
- Data integrity is important for practice records
- SQL skills are highly valued in job market

## 🛠️ Development

### Running in Development
```bash
# Terminal 1: Backend
cd backend
npm run dev  # Uses nodemon for auto-reload

# Terminal 2: Frontend
python3 server.py
```

### Adding New Chords
Edit `app.js` CONFIG object:
```javascript
chordSignatures: {
    'C7': { root: 130.81, type: 'dominant', strings: [0, 3, 2, 3, 1, 0] },
},
chordTabs: {
    'C7': 'x32310',
}
```

### Adding New Features
1. Create API endpoint in `backend/server.js`
2. Add frontend function to call API
3. Update UI to display results

## 🚀 Deployment

### Backend (Choose one)
- **Railway.app** - Easy PostgreSQL + Node.js deployment
- **Render.com** - Free tier available
- **Heroku** - Popular but limited free tier
- **AWS/GCP/Azure** - Enterprise options

### Frontend
- **Vercel** - Free hosting for static sites
- **Netlify** - Easy deployment with CI/CD
- **GitHub Pages** - Free for static content

## 📚 Learning Resources

### SQL
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [SQLZoo](https://sqlzoo.net/)

### Node.js
- [Node.js Documentation](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### Music Theory
- [Hooktheory](https://www.hooktheory.com/theory)
- [Music Theory for Guitar](https://www.justinguitar.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for hand tracking
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- PostgreSQL community

---

**Happy Practicing! 🎵**

*FretFly - Your AI guitar practice companion*
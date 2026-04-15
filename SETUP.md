# FretFly Setup Guide

## Quick Start (Without Backend)

If you just want to try FretFly quickly without setting up the database:

1. Open `index.html` directly in your browser
2. Click "Start" to begin using the vision and audio features
3. All data will be saved locally in your browser (localStorage)

## Full Setup (With Backend)

### Step 1: Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
createdb fretfly
```

#### Alternative: Use Docker
```bash
docker run --name fretfly-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
```

#### Alternative: Use Supabase (Free Cloud PostgreSQL)
1. Go to [supabase.com](https://supabase.com)
2. Create a free project
3. Get your database connection string

### Step 2: Fix NPM Cache Issues

If you're getting permission errors:
```bash
# Delete npm cache
sudo rm -rf ~/.npm/_cacache

# Or use npm with cache directory change
npm config set cache ~/.npm-tmp
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4: Configure Environment

```bash
cd backend
cp .env.example .env
nano .env  # Edit with your database credentials
```

For local PostgreSQL:
```
DATABASE_URL=postgresql://user@localhost:5432/fretfly
JWT_SECRET=your-random-secret-key-here
```

For Docker:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

For Supabase:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Step 5: Start the Backend

```bash
cd backend
npm start
```

### Step 6: Start the Frontend

In a new terminal:
```bash
python3 server.py
```

Open http://localhost:8000 in your browser.

## Troubleshooting

### NPM Permission Errors
```bash
# Create a directory for global npm packages
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your ~/.zshrc or ~/.bashrc
export PATH=~/.npm-global/bin:$PATH

# Source your shell config
source ~/.zshrc  # or source ~/.bashrc
```

### PostgreSQL Not Found
```bash
# Check if PostgreSQL is installed
which psql

# If not found, install it
brew install postgresql

# Start PostgreSQL service
brew services start postgresql
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
pg_isready

# Create the database
createdb fretfly

# Or connect manually
psql -U your-username -d fretfly
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in backend/.env
PORT=5001
```

## Alternative: Use SQLite (No PostgreSQL Required)

If you want to avoid PostgreSQL installation, you can modify the backend to use SQLite:

1. Install better-sqlite3:
```bash
cd backend
npm uninstall pg
npm install better-sqlite3
```

2. Modify `backend/server.js` to use SQLite instead of PostgreSQL.

## Need Help?

- Check the main README.md for more details
- Open an issue on GitHub
- Join our Discord community
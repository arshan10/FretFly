#!/usr/bin/env python3
"""
Simple HTTP server for the Guitar Chord Analyzer.
Run this script and open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import os

PORT = 8000

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎸  Guitar Chord Analyzer Server Started!              ║
║                                                           ║
║   Open your browser to:  http://localhost:{PORT}          ║
║                                                           ║
║   Press Ctrl+C to stop the server                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
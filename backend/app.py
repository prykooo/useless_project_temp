# backend/app.py
import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from flask import Flask, send_from_directory, jsonify
from backend.models.player import init_db
from backend.routes.game import game_bp
from backend.routes.leaderboard import leaderboard_bp
from backend.routes.profiles import profiles_bp

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

# Initialize DB on load
init_db()

# Register API blueprints
app.register_blueprint(game_bp)
app.register_blueprint(leaderboard_bp)
app.register_blueprint(profiles_bp)

# Page Routes
@app.route('/')
def index_page():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/game')
@app.route('/game.html')
def game_page():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'pages'), 'game.html')

@app.route('/leaderboard')
@app.route('/leaderboard.html')
def leaderboard_page():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'pages'), 'leaderboard.html')

@app.route('/profiles')
@app.route('/profiles.html')
def profiles_page():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'pages'), 'profiles.html')

# Static asset fallback
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(FRONTEND_DIR, filename)

if __name__ == '__main__':
    print("==================================================")
    print("🎰 WHO PAYS? - The Ultimate Bill Roulette Mini-Game")
    print("🚀 Server running at: http://127.0.0.1:5000")
    print("==================================================")
    app.run(host='0.0.0.0', port=5000, debug=True)
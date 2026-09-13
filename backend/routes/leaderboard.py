# backend/routes/leaderboard.py
from flask import Blueprint, jsonify
from backend.models.player import get_leaderboards

leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')

@leaderboard_bp.route('', methods=['GET'])
def fetch_leaderboard():
    leaderboards = get_leaderboards()
    return jsonify(leaderboards)
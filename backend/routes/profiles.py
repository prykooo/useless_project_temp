# backend/routes/profiles.py
from flask import Blueprint, jsonify
from backend.models.player import get_all_profiles, get_player_profile

profiles_bp = Blueprint('profiles', __name__, url_prefix='/api/profiles')

@profiles_bp.route('', methods=['GET'])
def list_profiles():
    profiles = get_all_profiles()
    return jsonify(profiles)

@profiles_bp.route('/<name>', methods=['GET'])
def get_profile(name):
    profile = get_player_profile(name)
    if not profile:
        return jsonify({'error': 'Player not found'}), 404
    return jsonify(profile)
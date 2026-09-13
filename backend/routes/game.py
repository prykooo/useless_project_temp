# backend/routes/game.py
from flask import Blueprint, request, jsonify
import random
from backend.models.player import record_game_round

game_bp = Blueprint('game', __name__, url_prefix='/api/game')

CARD_DEFINITIONS = {
    'SAFE': {
        'type': 'SAFE',
        'icon': '🛡️',
        'title': 'SAFE',
        'malayalam_title': 'സുരക്ഷിതം',
        'text': 'ഇന്ന് നീ രക്ഷപ്പെട്ടു!',
        'tagline': 'ഷീൽഡ് റെഡി! റൗലറ്റ് വീണ്ടും കറങ്ങും!',
        'description': 'If selected, you escape paying and the roulette spins again.'
    },
    'LUCKY': {
        'type': 'LUCKY',
        'icon': '🍀',
        'title': 'LUCKY',
        'malayalam_title': 'ഭാഗ്യവാൻ',
        'text': 'ഭാഗ്യം ഇന്നും കൂടെയുണ്ട്!',
        'tagline': 'റൗലറ്റിൽ നിന്നെ തൊടാൻ സാധ്യത കുറവാണ്!',
        'description': 'Gives you a significantly lower probability of being selected by the wheel.'
    },
    'SWAP': {
        'type': 'SWAP',
        'icon': '🔄',
        'title': 'SWAP',
        'malayalam_title': 'സ്വാപ്പ്',
        'text': 'ഇത് നിനക്ക് വേണ്ട… മറ്റൊരാൾക്ക് കൊടുക്കാം!',
        'tagline': 'പണി മറ്റൊരാൾക്ക് കൈമാറാൻ സുവർണ്ണാവസരം!',
        'description': 'If selected, you can pass the entire bill to another player of your choice.'
    },
    'DOUBLE': {
        'type': 'DOUBLE',
        'icon': '💀',
        'title': 'DOUBLE',
        'malayalam_title': 'ഇരട്ടി പ്രഹരം',
        'text': 'ഇന്നത്തെ ബിൽ… ഇരട്ടിയായി!',
        'tagline': 'പോക്കറ്റ് കാലിയാകുന്ന കാഴ്ച കണ്ടോളൂ!',
        'description': 'If selected, you pay 2x the bill amount!'
    }
}

MALAYALAM_DIALOGUES = {
    'NORMAL': [
        'വിധി തീരുമാനിച്ചു കഴിഞ്ഞു.',
        'ഇനി എന്ത് ചെയ്യാൻ പറ്റും… അടച്ചോ!',
        'ഇന്നത്തെ ബിൽ നിനക്കുള്ളതാണ്!',
        'ഭാഗ്യം നിന്നെ വിട്ടുപോയി.',
        'പോക്കറ്റ് കാലിയാക്കാൻ ഒരാൾ എത്തിയിട്ടുണ്ട്!',
        'കണ്ണടച്ച് കാർഡ് അങ്ങ് തേച്ചേക്ക് സുഹൃത്തേ!',
        'സുഹൃത്തുക്കളുടെ വയറു നിറഞ്ഞു, നിന്റെ പഴ്സ് ഒഴിഞ്ഞു!',
        'ഗൂഗിൾ പേ തുറക്കൂ, ചിരിച്ചുകൊണ്ട് പണം അയക്കൂ!'
    ],
    'DOUBLE': [
        'ഇന്നത്തെ ബിൽ… ഇരട്ടിയായി! തലയിൽ കൈവെച്ചോ!',
        'ഡബിൾ പണി! ഇന്ന് നീ മാത്രമേ അടയ്ക്കൂ, അതും ഇരട്ടി തുക!',
        'പോക്കറ്റിന് ഇന്ന് കട്ടപ്പൊക! ഇരട്ടി തുക റെഡിയാക്കിക്കോ!',
        'ഇരട്ടി അടി! സുഹൃത്തുക്കളുടെ സ്നേഹോപഹാരം!'
    ],
    'SWAP': [
        'ഇത് നിനക്ക് വേണ്ട… മറ്റൊരാൾക്ക് കൊടുക്കാം! പണി പാലുംവെള്ളത്തിൽ കൊടുത്തു!',
        'സ്വന്തം കഴുത്തിലെ കുരുക്ക് എടുത്ത് സുഹൃത്തിന്റെ കഴുത്തിലിട്ടു!',
        'നല്ല സുഹൃത്തുക്കൾ പണി ഷെയർ ചെയ്യാറില്ല, മൊത്തമായി കൊടുക്കും!',
        'സ്വാപ്പ് മാജിക്! ഒരാളുടെ സന്തോഷം മറ്റൊരാളുടെ വിലാപം!'
    ],
    'SAFE': [
        'ഇന്ന് നീ രക്ഷപ്പെട്ടു! അടുത്ത ആൾ പ്രാർത്ഥിച്ചോ!',
        'ഷീൽഡ് ഉയർന്നു, ബിൽ പാളിപ്പോയി! വീണ്ടും കറങ്ങുന്നു!'
    ]
}

WHEEL_COLORS = [
    '#ec4899', '#8b5cf6', '#3b82f6', '#10b981',
    '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
]

@game_bp.route('/deal-cards', methods=['POST'])
def deal_cards():
    data = request.get_json() or {}
    players = data.get('players', [])
    
    if not isinstance(players, list) or len(players) < 2:
        return jsonify({'error': 'Minimum 2 players required to deal cards'}), 400
        
    card_keys = list(CARD_DEFINITIONS.keys())
    assignments = {}
    
    # Ensure variety of cards if player count allows
    pool = card_keys.copy()
    random.shuffle(pool)
    
    for i, player in enumerate(players):
        # Pick from shuffled pool, or random if pool exhausted
        card_type = pool[i] if i < len(pool) else random.choice(card_keys)
        assignments[player] = CARD_DEFINITIONS[card_type]
        
    return jsonify({
        'cards': assignments
    })

@game_bp.route('/spin', methods=['POST'])
def spin():
    data = request.get_json() or {}
    players = data.get('players', [])
    cards = data.get('cards', {})
    excluded = set(data.get('excluded', []))
    
    active_players = [p for p in players if p not in excluded]
    if not active_players:
        # If all were excluded, fall back to all players
        active_players = players.copy()
        
    # Calculate probability weights
    # Normal: 100
    # LUCKY: 35 (substantially reduced chance, mathematically effective)
    weights = {}
    for p in active_players:
        card = cards.get(p, {})
        if card.get('type') == 'LUCKY':
            weights[p] = 35.0
        else:
            weights[p] = 100.0
            
    total_weight = sum(weights.values())
    
    # Compute slice angles for canvas wheel
    slices = []
    current_deg = 0.0
    for i, p in enumerate(active_players):
        slice_deg = (weights[p] / total_weight) * 360.0
        slices.append({
            'player': p,
            'weight': weights[p],
            'start_deg': round(current_deg, 2),
            'end_deg': round(current_deg + slice_deg, 2),
            'span_deg': round(slice_deg, 2),
            'color': WHEEL_COLORS[i % len(WHEEL_COLORS)],
            'card': cards.get(p, {})
        })
        current_deg += slice_deg
        
    # Weighted selection
    r = random.uniform(0, total_weight)
    running = 0.0
    selected_player = active_players[0]
    for p in active_players:
        running += weights[p]
        if r <= running:
            selected_player = p
            break
            
    # Find matching slice
    target_slice = next((s for s in slices if s['player'] == selected_player), slices[0])
    # Target angle in the middle of the selected player's slice
    target_angle = (target_slice['start_deg'] + target_slice['end_deg']) / 2.0
    
    return jsonify({
        'selected_player': selected_player,
        'card': cards.get(selected_player, {}),
        'slices': slices,
        'target_angle': round(target_angle, 2),
        'weights': weights
    })

@game_bp.route('/dialogue', methods=['POST'])
def get_dialogue():
    data = request.get_json() or {}
    category = data.get('category', 'NORMAL')
    lines = MALAYALAM_DIALOGUES.get(category, MALAYALAM_DIALOGUES['NORMAL'])
    return jsonify({
        'dialogue': random.choice(lines)
    })

@game_bp.route('/record', methods=['POST'])
def record():
    data = request.get_json() or {}
    
    bill_amount = data.get('bill_amount')
    final_amount = data.get('final_amount')
    initial_selected = data.get('initial_selected')
    final_payer = data.get('final_payer')
    card_triggered = data.get('card_triggered', 'NORMAL')
    swap_target = data.get('swap_target')
    player_names = data.get('players', [])
    card_assignments = data.get('cards', {})
    dialogue_shown = data.get('dialogue_shown', 'വിധി തീരുമാനിച്ചു കഴിഞ്ഞു.')
    
    if not bill_amount or not final_payer or not initial_selected or not player_names:
        return jsonify({'error': 'Missing required round details'}), 400
        
    updated_payer = record_game_round(
        bill_amount=bill_amount,
        final_amount=final_amount,
        initial_selected=initial_selected,
        final_payer=final_payer,
        card_triggered=card_triggered,
        swap_target=swap_target,
        player_names=player_names,
        card_assignments=card_assignments,
        dialogue_shown=dialogue_shown
    )
    
    return jsonify({
        'status': 'success',
        'payer': updated_payer
    })
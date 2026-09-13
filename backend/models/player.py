# backend/models/player.py
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'database.db')

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL COLLATE NOCASE,
            games_played INTEGER DEFAULT 0,
            bills_paid INTEGER DEFAULT 0,
            total_amount_paid REAL DEFAULT 0.0,
            times_selected INTEGER DEFAULT 0,
            times_escaped INTEGER DEFAULT 0,
            times_lucky INTEGER DEFAULT 0,
            times_double INTEGER DEFAULT 0,
            times_swapped_out INTEGER DEFAULT 0,
            times_swapped_in INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_rounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            bill_amount REAL NOT NULL,
            final_amount REAL NOT NULL,
            initial_selected TEXT NOT NULL,
            final_payer TEXT NOT NULL,
            card_triggered TEXT NOT NULL,
            swap_target TEXT,
            player_count INTEGER NOT NULL,
            dialogue_shown TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def get_or_create_player(cursor, name):
    clean_name = name.strip()
    cursor.execute('SELECT * FROM players WHERE name = ? COLLATE NOCASE', (clean_name,))
    player = cursor.fetchone()
    if not player:
        cursor.execute('INSERT INTO players (name) VALUES (?)', (clean_name,))
        cursor.execute('SELECT * FROM players WHERE name = ? COLLATE NOCASE', (clean_name,))
        player = cursor.fetchone()
    return player

def compute_character_identity(player):
    """
    Calculates a funny, dynamic Malayalam and English character identity
    based on the player's actual gameplay statistics.
    """
    games = player['games_played']
    bills = player['bills_paid']
    total_amount = player['total_amount_paid']
    escapes = player['times_escaped']
    selected = player['times_selected']
    doubles = player['times_double']
    lucky = player['times_lucky']
    swapped_out = player['times_swapped_out']
    swapped_in = player['times_swapped_in']
    
    if games == 0:
        return {
            'identity': 'Rookie Diner',
            'malayalam_title': 'പുതുമുഖം',
            'badge': '🌱',
            'color': '#38bdf8',
            'quote': 'ഇതുവരെ പണി കിട്ടിയിട്ടില്ല, കാത്തിരിക്കൂ!'
        }
    
    # Priority-based identity assignment
    if escapes >= 2 and escapes >= bills:
        return {
            'identity': 'Escape Artist',
            'malayalam_title': 'രക്ഷപ്പെടലിൽ പിഎച്ച്ഡി',
            'badge': '🏃',
            'color': '#34d399',
            'quote': 'ഷീൽഡ് ഉള്ളിടത്തോളം കാലം ഞാൻ സേഫാണ്!'
        }
    elif total_amount >= 3000 or (bills >= 3 and total_amount >= 1500):
        return {
            'identity': 'The Financier',
            'malayalam_title': 'ഗ്രൂപ്പിന്റെ സ്പോൺസർ',
            'badge': '💎',
            'color': '#fbbf24',
            'quote': 'പൈസ ഒരു പ്രശ്നമേയല്ല (ഉള്ളിൽ കരയുന്നു).'
        }
    elif doubles >= 1 and bills >= 1:
        return {
            'identity': 'Danger Magnet',
            'malayalam_title': 'ഇരട്ടി പ്രഹരം വാങ്ങിയവൻ',
            'badge': '💀',
            'color': '#f87171',
            'quote': 'തലയിലെഴുത്ത് തന്നെ ഡബിൾ ബില്ലാണ്!'
        }
    elif swapped_out >= 1:
        return {
            'identity': 'Uno Reverse Master',
            'malayalam_title': 'പണി തിരിച്ചു കൊടുത്തവൻ',
            'badge': '🔄',
            'color': '#a78bfa',
            'quote': 'എനിക്ക് വേണ്ടത് ഞാൻ സ്നേഹത്തോടെ നിനക്ക് തരും!'
        }
    elif swapped_in >= 1 and bills >= 1:
        return {
            'identity': 'Innocent Victim',
            'malayalam_title': 'ചതിക്കപ്പെട്ടവൻ',
            'badge': '🎯',
            'color': '#fb923c',
            'quote': 'സ്വാപ്പ് കാർഡ് കണ്ടുപിടിച്ചവനെ കിട്ടിയാൽ മതിയായിരുന്നു!'
        }
    elif bills >= 2:
        return {
            'identity': 'Professional Payer',
            'malayalam_title': 'ബില്ല് കാണുമ്പോൾ കാർഡ് എടുക്കുന്നവൻ',
            'badge': '💳',
            'color': '#ec4899',
            'quote': 'നിങ്ങൾ കഴിക്കൂ, ബില്ല് ഞാൻ നോക്കിക്കോളാം...'
        }
    elif lucky >= 2 and bills == 0:
        return {
            'identity': 'Born Lucky',
            'malayalam_title': 'ഭാഗ്യദേവതയുടെ സ്വന്തം',
            'badge': '🍀',
            'color': '#10b981',
            'quote': 'ഭാഗ്യം ഇന്നും എന്നും കൂടെയുണ്ട്!'
        }
    elif games >= 2 and bills == 0:
        return {
            'identity': 'Stealth Survivor',
            'malayalam_title': 'അടയ്ക്കാതെ മുങ്ങുന്നവൻ',
            'badge': '🥷',
            'color': '#6366f1',
            'quote': 'ഫ്രീയായി തിന്ന് സുഖമായി ജീവിക്കുന്നു!'
        }
    else:
        return {
            'identity': 'Casual Diner',
            'malayalam_title': 'സാധാരണ തീറ്റപ്രിയൻ',
            'badge': '🍽️',
            'color': '#94a3b8',
            'quote': 'ഞാൻ കഴിക്കാൻ മാത്രമേ വന്നിട്ടുള്ളൂ.'
        }

def record_game_round(bill_amount, final_amount, initial_selected, final_payer,
                      card_triggered, swap_target, player_names, card_assignments, dialogue_shown):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Update games_played for all involved players
    for p_name in player_names:
        get_or_create_player(cursor, p_name)
        card_type = card_assignments.get(p_name, {}).get('type')
        lucky_inc = 1 if card_type == 'LUCKY' else 0
        
        cursor.execute('''
            UPDATE players 
            SET games_played = games_played + 1,
                times_lucky = times_lucky + ?
            WHERE name = ? COLLATE NOCASE
        ''', (lucky_inc, p_name.strip()))
        
    # 2. Update initial selected
    cursor.execute('''
        UPDATE players
        SET times_selected = times_selected + 1
        WHERE name = ? COLLATE NOCASE
    ''', (initial_selected.strip(),))
    
    # 3. Card triggered impacts
    if card_triggered == 'SAFE':
        cursor.execute('''
            UPDATE players
            SET times_escaped = times_escaped + 1
            WHERE name = ? COLLATE NOCASE
        ''', (initial_selected.strip(),))
        
    elif card_triggered == 'SWAP' and swap_target:
        cursor.execute('''
            UPDATE players
            SET times_swapped_out = times_swapped_out + 1
            WHERE name = ? COLLATE NOCASE
        ''', (initial_selected.strip(),))
        cursor.execute('''
            UPDATE players
            SET times_swapped_in = times_swapped_in + 1
            WHERE name = ? COLLATE NOCASE
        ''', (swap_target.strip(),))
        
    elif card_triggered == 'DOUBLE':
        cursor.execute('''
            UPDATE players
            SET times_double = times_double + 1
            WHERE name = ? COLLATE NOCASE
        ''', (final_payer.strip(),))
        
    # 4. Final payer payment record
    cursor.execute('''
        UPDATE players
        SET bills_paid = bills_paid + 1,
            total_amount_paid = total_amount_paid + ?
        WHERE name = ? COLLATE NOCASE
    ''', (float(final_amount), final_payer.strip()))
    
    # 5. Insert game round record
    cursor.execute('''
        INSERT INTO game_rounds 
        (bill_amount, final_amount, initial_selected, final_payer, card_triggered, swap_target, player_count, dialogue_shown)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (float(bill_amount), float(final_amount), initial_selected.strip(), final_payer.strip(),
          card_triggered, swap_target.strip() if swap_target else None, len(player_names), dialogue_shown))
          
    conn.commit()
    
    # Fetch updated final payer details
    cursor.execute('SELECT * FROM players WHERE name = ? COLLATE NOCASE', (final_payer.strip(),))
    updated_payer = dict(cursor.fetchone())
    updated_payer['character'] = compute_character_identity(updated_payer)
    
    conn.close()
    return updated_payer

def get_leaderboards():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 🏆 Biggest Wallet: Most money paid
    cursor.execute('''
        SELECT * FROM players 
        WHERE total_amount_paid > 0
        ORDER BY total_amount_paid DESC, bills_paid DESC
        LIMIT 10
    ''')
    biggest_wallet = [dict(r) for r in cursor.fetchall()]
    
    # 😭 Most Unlucky: Highest times selected & bills paid
    cursor.execute('''
        SELECT * FROM players 
        WHERE times_selected > 0 OR bills_paid > 0
        ORDER BY times_selected DESC, bills_paid DESC, times_double DESC
        LIMIT 10
    ''')
    most_unlucky = [dict(r) for r in cursor.fetchall()]
    
    # 🍀 Luckiest: High escape count, low bills, high lucky card count
    cursor.execute('''
        SELECT *, ((times_escaped * 3) + (times_lucky * 2) - (bills_paid * 2)) as luck_score
        FROM players
        WHERE games_played > 0
        ORDER BY luck_score DESC, times_escaped DESC, total_amount_paid ASC
        LIMIT 10
    ''')
    luckiest = [dict(r) for r in cursor.fetchall()]
    
    # 👑 Bill King/Queen: Most bills paid count
    cursor.execute('''
        SELECT * FROM players 
        WHERE bills_paid > 0
        ORDER BY bills_paid DESC, total_amount_paid DESC
        LIMIT 10
    ''')
    bill_king = [dict(r) for r in cursor.fetchall()]
    
    # 🏃 Escape Artist: Most times saved by SAFE card
    cursor.execute('''
        SELECT * FROM players 
        WHERE times_escaped > 0
        ORDER BY times_escaped DESC, games_played DESC
        LIMIT 10
    ''')
    escape_artist = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    # Attach character identity to each entry
    for group in (biggest_wallet, most_unlucky, luckiest, bill_king, escape_artist):
        for p in group:
            p['character'] = compute_character_identity(p)
            
    return {
        'biggest_wallet': biggest_wallet,
        'most_unlucky': most_unlucky,
        'luckiest': luckiest,
        'bill_king': bill_king,
        'escape_artist': escape_artist
    }

def get_all_profiles():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM players ORDER BY games_played DESC, bills_paid DESC, total_amount_paid DESC')
    rows = cursor.fetchall()
    conn.close()
    
    profiles = []
    for r in rows:
        p = dict(r)
        p['character'] = compute_character_identity(p)
        if p['games_played'] > 0:
            dodge_rate = max(0, min(100, round(((p['games_played'] - p['bills_paid']) / p['games_played']) * 100)))
        else:
            dodge_rate = 100
        p['dodge_rate'] = dodge_rate
        profiles.append(p)
        
    return profiles

def get_player_profile(name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM players WHERE name = ? COLLATE NOCASE', (name.strip(),))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return None
        
    p = dict(row)
    p['character'] = compute_character_identity(p)
    if p['games_played'] > 0:
        p['dodge_rate'] = max(0, min(100, round(((p['games_played'] - p['bills_paid']) / p['games_played']) * 100)))
    else:
        p['dodge_rate'] = 100
        
    cursor.execute('''
        SELECT * FROM game_rounds 
        WHERE final_payer = ? COLLATE NOCASE OR initial_selected = ? COLLATE NOCASE OR swap_target = ? COLLATE NOCASE
        ORDER BY created_at DESC
        LIMIT 10
    ''', (name.strip(), name.strip(), name.strip()))
    p['recent_rounds'] = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return p
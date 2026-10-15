import os
import requests
from flask import Flask, render_template, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Using environment variables for credentials to keep them secure
API_KEY = os.environ.get("API_KEY", "7c87d5a052a886e91c46465f2c24a0e1")
TOURNAMENT_ID = os.environ.get("TOURNAMENT_ID", "201")
if TOURNAMENT_ID in ["184", "195"]:
    TOURNAMENT_ID = "201"
BASE_URL = "https://4moles.com/api/v1"

# GFX State
gfx_state = {
    "show_gfx": False,
    "gfx_type": "team_table", # team_table, team_ticker, individual_table, individual_ticker, player_spotlight
    "spotlight_player_id": None,
    "tournament_id": TOURNAMENT_ID
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/api/state', methods=['GET', 'POST'])
def state():
    global TOURNAMENT_ID
    from flask import request
    if request.method == 'POST':
        data = request.json
        if 'show_gfx' in data:
            gfx_state['show_gfx'] = data['show_gfx']
        if 'gfx_type' in data:
            gfx_state['gfx_type'] = data['gfx_type']
        if 'spotlight_player_id' in data:
            gfx_state['spotlight_player_id'] = data['spotlight_player_id']
        if 'tournament_id' in data and data['tournament_id']:
            TOURNAMENT_ID = str(data['tournament_id'])
            gfx_state['tournament_id'] = TOURNAMENT_ID
        return jsonify({"status": "success", "state": gfx_state})
    gfx_state['tournament_id'] = TOURNAMENT_ID
    return jsonify(gfx_state)

@app.route('/api/players')
def get_players():
    # Helper to get player list for the dropdown
    headers = {
        "X-Access-Key": API_KEY,
        "Accept": "application/json"
    }
    try:
        response = requests.get(f"{BASE_URL}/view_leaderboard?tournament_id={TOURNAMENT_ID}", headers=headers, verify=False)
        response.raise_for_status()
        data = response.json()
        players = []
        if "scores" in data:
            for p in data["scores"]:
                players.append({
                    "id": p["user_id"],
                    "name": f"{p['firstname']} {p['lastname']}",
                    "team": p.get("team_name", "Unknown")
                })
        return jsonify({"status": "success", "players": players})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/leaderboard')
def get_leaderboard():
    headers = {
        "X-Access-Key": API_KEY,
        "Accept": "application/json"
    }
    try:
        response = requests.get(f"{BASE_URL}/view_leaderboard?tournament_id={TOURNAMENT_ID}", headers=headers, verify=False)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/team_leaderboard')
def get_team_leaderboard():
    headers = {
        "X-Access-Key": API_KEY,
        "Accept": "application/json"
    }
    try:
        response = requests.get(f"{BASE_URL}/team_leaderboard?tournament_id={TOURNAMENT_ID}", headers=headers, verify=False)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/overall_standings')
def get_overall_standings():
    overall_teams = [
        {
            "rank": 1,
            "team_name": "Hyderabad Albatross",
            "legs": {"KLR": "+570", "HYD": "+547", "BLR": "+566", "GUR": "-", "AMD": "-", "DEL": "-"},
            "points": "+26"
        },
        {
            "rank": 2,
            "team_name": "Ahmedabad Aces",
            "legs": {"KLR": "+561", "HYD": "+556", "BLR": "+590", "GUR": "-", "AMD": "-", "DEL": "-"},
            "points": "+20"
        },
        {
            "rank": 3,
            "team_name": "KHT Bangalore Eagles",
            "legs": {"KLR": "+565", "HYD": "+561", "BLR": "+582", "GUR": "-", "AMD": "-", "DEL": "-"},
            "points": "+16"
        },
        {
            "rank": 4,
            "team_name": "Delhi Royals",
            "legs": {"KLR": "+577", "HYD": "+559", "BLR": "+570", "GUR": "-", "AMD": "-", "DEL": "-"},
            "points": "+15"
        },
        {
            "rank": 5,
            "team_name": "Kolar Zioneers",
            "legs": {"KLR": "+576", "HYD": "+579", "BLR": "+572", "GUR": "-", "AMD": "-", "DEL": "-"},
            "points": "+9"
        },
        {
            "rank": 6,
            "team_name": "Gurugram Titans",
            "legs": {"KLR": "+571", "HYD": "+574", "BLR": "+596", "GUR": "-", "AMD": "-", "DEL": "-"},
            "points": "+7"
        }
    ]

    headers = {
        "X-Access-Key": API_KEY,
        "Accept": "application/json"
    }
    try:
        response = requests.get(f"{BASE_URL}/team_leaderboard?tournament_id={TOURNAMENT_ID}", headers=headers, verify=False, timeout=3)
        if response.status_code == 200:
            live_data = response.json()
            if "teams" in live_data:
                for live_t in live_data["teams"]:
                    for ot in overall_teams:
                        if live_t["team_name"].lower().strip() == ot["team_name"].lower().strip():
                            if live_t.get("team_image"):
                                ot["team_image"] = live_t["team_image"]
    except Exception:
        pass

    return jsonify({"status": "success", "standings": overall_teams})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)

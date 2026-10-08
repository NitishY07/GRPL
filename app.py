import os
import requests
from flask import Flask, render_template, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Using environment variables for credentials to keep them secure
API_KEY = os.environ.get("API_KEY", "7c87d5a052a886e91c46465f2c24a0e1")
TOURNAMENT_ID = os.environ.get("TOURNAMENT_ID", "184")
BASE_URL = "https://4moles.com/api/v1"

# GFX State
gfx_state = {
    "show_gfx": False,
    "gfx_type": "team_table", # team_table, team_ticker, individual_table, individual_ticker, player_spotlight
    "spotlight_player_id": None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/api/state', methods=['GET', 'POST'])
def state():
    from flask import request
    if request.method == 'POST':
        data = request.json
        if 'show_gfx' in data:
            gfx_state['show_gfx'] = data['show_gfx']
        if 'gfx_type' in data:
            gfx_state['gfx_type'] = data['gfx_type']
        if 'spotlight_player_id' in data:
            gfx_state['spotlight_player_id'] = data['spotlight_player_id']
        return jsonify({"status": "success", "state": gfx_state})
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)

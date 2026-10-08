# Tournament Leaderboard GFX System

This is a Python Flask web application that acts as a secure middleware and frontend (GFX) to display real-time tournament leaderboard data from the 4moles API. 

## Security Note
**The API credentials are stored securely in the `.env` file and are never sent to the client (browser). Do not commit the `.env` file or share your API Key anywhere.**

## Setup Instructions

1. Ensure you have Python installed.
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Update the `.env` file if your API key or Tournament ID changes.
4. Run the Flask application:
   ```bash
   python app.py
   ```
5. Open your web browser and go to `http://127.0.0.1:5000` to view the graphics.

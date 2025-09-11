from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import time
from dotenv import load_dotenv
from PIL import Image
import json
import sqlite3
import base64
from openai import OpenAI

# --- INITIALIZATION ---
load_dotenv()
app = Flask(__name__)
CORS(app) 

# --- CONFIGURATION ---
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configure OpenAI Client
try:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables.")
    client = OpenAI(api_key=openai_api_key)
    print("OpenAI Client configured successfully.")
except Exception as e:
    print(f"FATAL: Failed to configure OpenAI Client: {e}")


# --- DATABASE (SQLite for local dev) ---
def get_db_connection():
    conn = sqlite3.connect('local_expenses.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, expense_name TEXT, 
            amount REAL, currency TEXT, paid_by TEXT, category TEXT, 
            status TEXT, receipt_url TEXT, notes TEXT
        );
    ''')
    conn.commit()
    cursor.close()
    conn.close()

# --- API ROUTES ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Serve the React app's main file for any non-API route
    return send_from_directory('../dist', 'index.html')

@app.route('/expenses', methods=['GET', 'POST'])
def handle_expenses():
    conn = get_db_connection()
    if request.method == 'GET':
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM expenses ORDER BY id DESC')
        rows = cursor.fetchall()
        expenses = [dict(row) for row in rows]
        conn.close()
        return jsonify(expenses)

    if request.method == 'POST':
        data = request.get_json()
        cursor = conn.cursor()
        query = "INSERT INTO expenses (date, expense_name, amount, currency, paid_by, category, status, receipt_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        values = (data.get('Date'), data.get('Expense_Name'), data.get('Amount'), data.get('Currency'), data.get('Paid_By'), data.get('Category'), data.get('Status'), data.get('Receipt_URL'), data.get('Notes'))
        cursor.execute(query, values)
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'}), 201

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'receipt' not in request.files: return jsonify({'error': 'No file part'}), 400
    file = request.files['receipt']
    if file.filename == '': return jsonify({'error': 'No selected file'}), 400
    if file:
        original_filename = secure_filename(file.filename)
        timestamp = int(time.time())
        unique_filename = f"{timestamp}_{original_filename}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(save_path)
        return jsonify({'filePath': f'/uploads/{unique_filename}'}), 200
    return jsonify({'error': 'An unknown error occurred'}), 500

@app.route('/extract-details', methods=['POST'])
def extract_details():
    if 'receipt' not in request.files:
        return jsonify({'error': 'No image provided for extraction'}), 400

    image_file = request.files['receipt']

    try:
        print(">>>> [1/3] Image received, encoding to base64...")
        # Encode image to base64
        img_bytes = image_file.read()
        base64_image = base64.b64encode(img_bytes).decode('utf-8')

        print(">>>> [2/3] Sending request to OpenAI API (GPT-4 Vision)...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """
                            Analyze the receipt image and extract the following details precisely into a single JSON object.
                            Do not add any extra text, comments, or markdown formatting like ```json.
                            The JSON object must have these exact keys: "Date", "Expense_Name", "Amount", "Currency", "Category".
                            - "Date": The date in YYYY-MM-DD format.
                            - "Expense_Name": The merchant's name.
                            - "Amount": The total amount as a number (float or integer).
                            - "Currency": The 3-letter currency code (e.g., THB, EUR, USD).
                            - "Category": A relevant category from this list: Food, Transport, Lodging, Entertainment, Supplies, Other.
                            """
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        print(">>>> [3/3] Response received from OpenAI. Parsing JSON...")
        json_text = response.choices[0].message.content
        cleaned_json_text = json_text.strip().replace("```json", "").replace("```", "").strip()
        parsed_json = json.loads(cleaned_json_text)
        print(">>>> OPENAI RESPONSE:", parsed_json)
        return jsonify(parsed_json)
        
    except Exception as e:
        # Enhanced diagnostics
        print(f"!!!!!!!!!!!!!! ERROR IN /extract-details !!!!!!!!!!!!!!")
        print(f"ERROR TYPE: {type(e).__name__}")
        print(f"ERROR DETAILS: {e}")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return jsonify({"error": f"AI extraction failed. Server error: {str(e)}"}), 500

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- MAIN EXECUTION ---
if __name__ == '__main__':
    init_db()
    print("Database initialized. Running in Development (SQLite) mode.")
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True, port=5001)

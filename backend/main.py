import os
import sys
import time
import json
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from openai import OpenAI
from sqlalchemy import text 

# Assure que le répertoire courant (backend) est dans sys.path pour les imports locaux
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# --- CONFIGURATION ---
# Importe la configuration appropriée (dev ou prod) depuis config.py
from config import app_config

app = Flask(__name__)
app.config.from_object(app_config)

# --- INITIALIZATION ---
CORS(app)
db = SQLAlchemy(app)

# Définition du chemin d'upload (déjà corrigé)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # S'assure que le dossier existe

# Configure OpenAI Client
try:
    openai_api_key = app.config.get('OPENAI_API_KEY')
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables.")
    client = OpenAI(api_key=openai_api_key)
    print("OpenAI Client configured successfully.")
except Exception as e:
    print(f"FATAL: Failed to configure OpenAI Client: {e}")

# --- DATABASE HELPERS ---
def init_db_command():
    """Commande pour initialiser la base de données."""
    with app.app_context():
        engine = db.get_engine()
        with engine.connect() as connection:
            # Choisit le DDL selon le dialecte (sqlite pour dev, mysql pour prod)
            dialect = engine.dialect.name
            if dialect == 'sqlite':
                create_sql = text('''
                    CREATE TABLE IF NOT EXISTS expenses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT,
                        expense_name TEXT,
                        amount REAL,
                        currency TEXT,
                        paid_by TEXT,
                        category TEXT,
                        locations TEXT,
                        status TEXT,
                        receipt_url TEXT,
                        notes TEXT
                    );
                ''')
            else:
                create_sql = text('''
                    CREATE TABLE IF NOT EXISTS expenses (
                        id INTEGER PRIMARY KEY AUTO_INCREMENT,
                        date TEXT,
                        expense_name TEXT,
                        amount DOUBLE,
                        currency VARCHAR(10),
                        paid_by TEXT,
                        category TEXT,
                        locations TEXT,
                        status TEXT,
                        receipt_url TEXT,
                        notes TEXT
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ''')

            connection.execute(create_sql)
            print("Database table 'expenses' checked/created (dialect: {} ).".format(dialect))

# Expose as a Flask CLI command
@app.cli.command("init-db")
def init_db_cli_command():
    """Crée les tables de la base de données."""
    init_db_command()
    print("Base de données initialisée.")

# --- API ROUTES ---
# Note: La gestion des routes reste très similaire, mais utilise l'engine SQLAlchemy

@app.route('/api/expenses', methods=['GET', 'POST'])
def handle_expenses():
    engine = db.get_engine()
    with engine.connect() as connection:
        if request.method == 'GET':
            result = connection.execute(text('SELECT * FROM expenses ORDER BY id DESC'))
            expenses = [dict(row._mapping) for row in result]
            # La logique de normalisation des locations reste la même
            for item in expenses:
                raw_loc = item.get('locations')
                if isinstance(raw_loc, str) and raw_loc:
                    try:
                        item['locations'] = json.loads(raw_loc)
                    except json.JSONDecodeError:
                        item['locations'] = []
                else:
                    item['locations'] = []
            return jsonify(expenses)

        if request.method == 'POST':
            data = request.get_json()

            # Normalisation des données (identique à l'ancien code)
            paid_by_value = data.get('paid_by') or data.get('Paid_By')
            category_data = data.get('Category') or data.get('category')
            category_text = ', '.join(map(str, category_data)) if isinstance(category_data, list) else category_data

            locations_data = data.get('locations', [])
            locations_json = json.dumps(locations_data) if isinstance(locations_data, list) else json.dumps([])

            query = text("""
                INSERT INTO expenses (date, expense_name, amount, currency, paid_by, category, locations, status, receipt_url, notes)
                VALUES (:date, :expense_name, :amount, :currency, :paid_by, :category, :locations, :status, :receipt_url, :notes)
            """)

            connection.execute(query, {
                'date': data.get('Date'),
                'expense_name': data.get('Expense_Name'),
                'amount': data.get('Amount'),
                'currency': data.get('Currency'),
                'paid_by': paid_by_value,
                'category': category_text,
                'locations': locations_json,
                'status': data.get('Status'),
                'receipt_url': data.get('Receipt_URL'),
                'notes': data.get('Notes')
            })
            connection.commit()
            return jsonify({'status': 'success'}), 201

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id: int):
    engine = db.get_engine()
    with engine.connect() as connection:
        result = connection.execute(text('DELETE FROM expenses WHERE id = :id'), {'id': expense_id})
        connection.commit()
        if result.rowcount == 0:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        return ('', 204)

@app.route('/api/expenses/all', methods=['DELETE'])
def clear_all_expenses():
    engine = db.get_engine()
    with engine.connect() as connection:
        connection.execute(text('DELETE FROM expenses'))
        connection.commit()
        return ('', 204)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'receipt' not in request.files: return jsonify({'error': 'No file part'}), 400
    file = request.files['receipt']
    if file.filename == '': return jsonify({'error': 'No selected file'}), 400
    if file:
        original_filename = secure_filename(file.filename)
        timestamp = int(time.time())
        unique_filename = f"{timestamp}_{original_filename}"
        # Utilise le chemin absolu configuré
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(save_path)
        return jsonify({'filePath': f'/api/uploads/{unique_filename}'}), 200
    return jsonify({'error': 'An unknown error occurred'}), 500

@app.route('/api/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# La route /api/extract-details reste inchangée, elle n'interagit pas avec la DB
@app.route('/api/extract-details', methods=['POST'])
def extract_details():
    if 'receipt' not in request.files:
        return jsonify({'error': 'No image provided for extraction'}), 400

    image_file = request.files['receipt']

    try:
        print(">>>> [1/3] Image received, encoding to base64...")
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
        print(f"!!!!!!!!!!!!!! ERROR IN /extract-details !!!!!!!!!!!!!!")
        print(f"ERROR TYPE: {type(e).__name__}")
        print(f"ERROR DETAILS: {e}")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return jsonify({"error": f"AI extraction failed. Server error: {str(e)}"}), 500
# ... après la dernière route API (@app.route('/api/extract-details', ...))

# --- SERVE REACT APP ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Sert l'application React en production."""
    # Le chemin pointe vers le dossier 'dist' à la racine du projet
    static_folder_path = os.path.join(app.root_path, '..', 'dist')
    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        return send_from_directory(static_folder_path, 'index.html')


# --- MAIN EXECUTION ---
if __name__ == '__main__':
    # Initialise automatiquement la table en développement pour éviter les erreurs de table manquante
    if app.config.get('DEBUG', False):
        init_db_command()
    print(f"Running in {app.config.get('DEBUG', 'production')} mode.")
    print(f"Database URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    app.run(host='0.0.0.0', port=5001, debug=app.config['DEBUG'])

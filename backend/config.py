import os
from dotenv import load_dotenv

# Charge les variables du .env pour le développement local (depuis le répertoire backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(BASE_DIR, '.env')
load_dotenv(DOTENV_PATH)

class Config:
    """Classe de configuration de base."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'une-cle-secrete-par-defaut')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

    # Configuration SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    """Configuration pour le développement."""
    DEBUG = True
    # Fallback sur une base de données SQLite si DATABASE_URL n'est pas définie
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///local_expenses.db')

class ProductionConfig(Config):
    """Configuration pour la production."""
    DEBUG = False

    def __init__(self):
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("No DATABASE_URL set for production environment")
        # Assure-toi que l'URL utilise le driver pymysql
        if database_url.startswith("mysql://"):
            database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
        self.SQLALCHEMY_DATABASE_URI = database_url

# Exporte la configuration appropriée en fonction de l'environnement
config_by_name = dict(
    development=DevelopmentConfig,
    production=ProductionConfig
)

key = os.getenv('FLASK_ENV', 'development')
# Instancie la classe de configuration sélectionnée
app_config = config_by_name[key]()

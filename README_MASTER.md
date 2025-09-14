# SaaS Expense Manager v0.1.0

## 1. Vue d'ensemble

**Mission** : Transformer cette application d'extraction de dépenses en une plateforme SaaS v1.0 robuste, scalable et prête pour le marché.

**Application Actuelle** : Application frontend (client-side) qui utilise l'API Gemini pour extraire les données de reçus numérisés. Les données sont actuellement gérées localement dans le navigateur.

- **Lead Architecte** : Seb
- **Stratège SaaS** : Gemini
- **Implémenteur IDE** : Windsurf

---

## 2. Architecture Technique (v0.1.0)

- **Framework Frontend** : React 19
- **Langage** : TypeScript
- **Outil de Build** : Vite
- **Styling** : TailwindCSS (via CDN)
- **API IA** : Google Gemini API (`@google/genai`)
- **Dépendances JS** :
  - `react`, `react-dom`
  - `@google/genai`
- **Environnement de Dev** : Node.js

**Points d'attention pour la v1.0 :**
- L'application est **100% frontend**. Pour un SaaS, un backend sera nécessaire pour gérer les utilisateurs, la persistance des données, et sécuriser les clés API.
- Les dépendances sont chargées via un CDN dans `index.html`. Ceci doit être migré vers une gestion de packages `npm` standard.
- La clé API Gemini est exposée côté client, ce qui est un **risque de sécurité majeur** à corriger impérativement avant la production.

---

## 3. Setup et Lancement en Local

**Prérequis :**
- Node.js (v18+ recommandé)
- npm (généralement inclus avec Node.js)

**Étapes :**

1.  **Cloner le projet** (si ce n'est pas déjà fait).

2.  **Créer le fichier d'environnement** :
    - Créer un fichier nommé `.env.local` à la racine du projet.
    - Ajouter la ligne suivante en remplaçant `VOTRE_CLE_API_GEMINI` par votre clé personnelle :
      ```
      GEMINI_API_KEY=VOTRE_CLE_API_GEMINI
      ```

3.  **Installer les dépendances** :
    ```bash
    npm install
    ```

4.  **Lancer le serveur de développement** :
    ```bash
    npm run dev
    ```

L'application devrait maintenant être accessible sur une URL locale (généralement `http://localhost:5173`).

---

## 4. Roadmap vers la v1.0 (SaaS)

-   [ ] **Phase 1 : Prise en main et déploiement initial**
    -   [X] Audit du code existant.
    -   [ ] Faire fonctionner l'application en local.
    -   [ ] Déployer la version actuelle sur un service d'hébergement statique (comme PythonAnywhere Web App, Netlify, ou Vercel) pour validation.

-   [ ] **Phase 2 : Sécurisation et Backend**
    -   [ ] Créer un backend simple (ex: Flask/FastAPI en Python, ou Express.js en Node) qui servira de proxy pour l'API Gemini. La clé API sera stockée sur ce serveur.
    -   [ ] Mettre en place une base de données (ex: SQLite, PostgreSQL) pour sauvegarder les dépenses.
    -   [ ] Créer des routes API sur notre backend pour `créer`, `lire`, `supprimer` les dépenses.
    -   [ ] Implémenter l'authentification des utilisateurs.

-   [ ] **Phase 3 : Améliorations et Scalabilité**
    -   [ ] Migrer la gestion des dépendances CDN vers `npm`.
    -   [ ] Mettre en place un système de tests.
    -   [ ] Configurer un pipeline de CI/CD pour les déploiements automatiques.
ADD ON : 









Here’s a concise repository audit and a proposed English README draft for your approval. I’ve highlighted a few questions to confirm details before I finalize and commit the README.

# Repository Audit: EXPENSES_MANAGER

- Path: `c:/Users/User/CODING/PHIL APP/EXPENSES_MANAGER/`

## Findings

- Backend
  - Files: `backend/main.py`, `backend/.env`, `backend/requirements.txt`, `backend/local_expenses.db`, `backend/uploads/`, `backend/test_db.py`
  - Current stack:
    - Flask + CORS, SQLite (local dev), OpenAI Vision via `openai` package
    - API endpoints:
      - `POST /extract-details` — base64 encodes image and calls OpenAI Vision (`gpt-4o`), returns JSON with keys: `Date`, `Expense_Name`, `Amount`, `Currency`, `Category`
      - `POST /upload` — saves file and returns `/uploads/<name>`
      - `GET /uploads/<filename>`
      - `GET/POST /expenses` — stores and serves expenses from SQLite
      - `GET /` — health text
    - Logging in `extract-details()` prints step-by-step and the parsed OpenAI response. Good for debugging.

- Frontend
  - Stack: React 19 + Vite 6 + TypeScript
  - Entry: `index.html`, `index.tsx`, `App.tsx`
  - Components: `components/ExpenseForm.tsx`, `components/ExpenseList.tsx`, `components/ExpenseListItem.tsx`, `components/CameraView.tsx`, `components/FileUpload.tsx`, icons and header
  - Types: `types.ts` defines `Expense`, `Status`, etc. with PascalCase fields (e.g., `Expense_Name`, `Amount`, `Currency`)
  - Constants: `constants.ts` holds AI prompts/schema for Gemini (leftover)
  - Services: `services/geminiService.ts` still references Gemini SDK (`@google/genai`) and a client-side extraction function; this appears unused now that the backend handles extraction via OpenAI.

- Dependency state
  - Backend `requirements.txt`: Flask, Flask-Cors, python-dotenv, Pillow, openai, plus `mysql-connector-python` duplicated earlier — retained but probably not needed post-migration. Suggest removing both lines if MySQL is not used locally.
  - Frontend `package.json`: includes `"@google/genai": "^1.16.0"` which appears unused after backend migration. Suggest removing to reduce confusion and bundle size.

- Environment and secrets
  - `backend/.env` currently exists (contains OPENAI_API_KEY). IMPORTANT: This must not be committed.
  - `.gitignore` exists. Ensure it includes:
    - `backend/.env`
    - `.env.local`
  - Your push was blocked by GitHub secret scanning (good). We should:
    - Untrack `backend/.env`
    - Amend or rewrite commit to remove the secret from history
    - Push again

- Database and data model
  - Local dev: SQLite DB files present (`local_expenses.db`, `expenses.db`)
  - Frontend expects PascalCase fields, backend returns raw DB rows with snake_case — but `App.tsx` maps snake_case to PascalCase before setting state. Good.

- Dev workflow
  - Frontend: `npm run dev` → Vite at http://localhost:5173
  - Backend: `py -3 main.py` → Flask at http://127.0.0.1:5001
  - CORS configured

- Security / Prod considerations
  - Do not commit secrets; add `.env` and `.env.local` to `.gitignore`.
  - For production:
    - Set OPENAI_API_KEY via a secure secret store (env variable in hosting)
    - Consider adding rate limits and payload size limits
    - Add input validation and error shaping for frontend

- Testing
  - No test suite currently. Suggest minimal smoke tests for:
    - `/extract-details` response structure
    - `/expenses` insert and list
    - `/upload` and file retrieval

## Questions (please confirm)

1) Project name and description
- Confirm preferred project name (e.g., “AI Expense Extractor”).
- One-liner description okay as: “AI-assisted expense extraction from receipt images with a modern React frontend and Flask backend”?

2) Default ports and URLs
- Keep backend at `http://127.0.0.1:5001` and frontend at `http://localhost:5173`?

3) OpenAI model
- Confirm final model is `gpt-4o`. Any plan to parameterize via env (e.g., `OPENAI_MODEL=gpt-4o`)?

4) Frontend service cleanup
- Can we remove `services/geminiService.ts` and `@google/genai` from `package.json` since extraction happens on backend now?

5) Database strategy for production
- Is SQLite sufficient for initial MVP, or should we document optional MySQL/Postgres setup for production?

6) License and contribution
- Do you want a LICENSE file (e.g., MIT) and a CONTRIBUTING section?

# Proposed README (Draft for Approval)

Below is a complete README draft in English. I will not save it until you approve.

```markdown
# AI Expense Extractor

AI-assisted expense extraction from receipt images with a modern React + Vite frontend and a Flask backend. Extracts receipt fields via OpenAI Vision (gpt-4o), stores entries locally (SQLite), and provides a polished UI to capture, upload, and manage expenses.

## Features

- Upload a receipt image and extract:
  - Date
  - Expense Name
  - Amount
  - Currency
  - Category
- Edit or complete the form and save the expense
- View expense history, export to PDF (if enabled)
- Local development (SQLite), environment-based AI key

## Architecture

- Frontend: React 19 + Vite 6 + TypeScript
- Backend: Flask + CORS + SQLite
- AI: OpenAI Vision (gpt-4o)

Directory layout:
- `App.tsx`, `index.html`, `index.tsx`: App entry points
- `components/`: Reusable UI components
- `types.ts`: TypeScript models (e.g., `Expense`)
- `backend/`: Flask app, SQLite DB, uploads folder
- `uploads/`: example images for local testing

## Prerequisites

- Node.js 18+
- Python 3.10+
- An OpenAI API Key (Vision access). Set as `OPENAI_API_KEY`.

## Getting Started (Local Development)

1) Clone the repository and enter the directory:
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

2) Backend setup:
```bash
# Create backend virtual env (optional but recommended)
# python -m venv venv && source venv/Scripts/activate  # Windows PowerShell: venv\\Scripts\\Activate.ps1

# Create environment file
echo OPENAI_API_KEY=your_openai_api_key_here > backend/.env

# Install backend dependencies
py -3 -m pip install -r backend/requirements.txt

# Start backend
cd backend
py -3 main.py
# Backend runs at http://127.0.0.1:5001
```

3) Frontend setup:
```bash
# From project root
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

## Usage

- Open the app at `http://localhost:5173`.
- Upload a receipt image and click “Extract Details.”
- The form will populate; review and submit to save to the local database.
- The expense will appear in the history table.

## Environment Variables

- Backend (required):
  - `OPENAI_API_KEY` — Your OpenAI API key.

Recommended ignore rules (already in `.gitignore`):
- `backend/.env`
- `.env.local`

Do not commit secrets to the repository.

## API Overview

- `POST /upload`
  - Body: `multipart/form-data` with field `receipt`
  - Response: `{ "filePath": "/uploads/<filename>" }`

- `POST /extract-details`
  - Body: `multipart/form-data` with field `receipt`
  - Response: JSON with keys: `Date`, `Expense_Name`, `Amount`, `Currency`, `Category`

- `GET /expenses`
  - Returns the list of saved expenses

- `POST /expenses`
  - Body: JSON with the same keys as above plus optional fields

- `GET /uploads/<filename>`
  - Serves uploaded files

## Development Notes

- Logging: `/extract-details` logs step-by-step progress and prints the parsed OpenAI response for debugging.
- Types: Frontend uses PascalCase fields (`Expense_Name`, `Amount`, etc.); backend stores snake_case in SQLite, and the frontend maps fields when fetching.
- Cleanup: If no longer using Gemini, remove `services/geminiService.ts` and `"@google/genai"` from `package.json`.

## Roadmap

- Add tests (API smoke tests, component tests)
- Optional: Production DB (MySQL/Postgres) with migrations
- Optional: Auth and multi-user support
- Optional: Export and reporting enhancements

## Troubleshooting

- “Failed to fetch” on frontend:
  - Ensure backend is running at `http://127.0.0.1:5001`
- 500 on `/extract-details`:
  - Check the backend terminal logs; enhanced error messages will indicate the problem
  - Verify `OPENAI_API_KEY` is set and has Vision access
- Git push blocked by secret scanning:
  - Ensure `backend/.env` is ignored and not tracked
  - Amend/remove secret from commit history before pushing

## License

TBD (MIT recommended). Add a LICENSE file if desired.
```

## Recommended follow-ups

- Remove Gemini client leftovers:
  - Delete `services/geminiService.ts` if unused
  - Remove `"@google/genai"` from `package.json` and run `npm install`
- Confirm `.gitignore` includes `backend/.env` and `.env.local`
- Remove `mysql-connector-python` from backend requirements if not used anymore

Would you like me to:
- Finalize and write `README.md` with the above content?
- Clean up Gemini references and unused dependencies as recommended?
- Add a minimal `tests/` scaffold (e.g., pytest for backend smoke tests)?
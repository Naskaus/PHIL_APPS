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

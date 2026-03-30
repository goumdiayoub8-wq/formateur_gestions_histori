# Gestion des horaires des formateurs

Application de gestion des formateurs, des affectations, du planning hebdomadaire, des validations pédagogiques et des exports de rapports.

## Contenu du dépôt

- `frontend/` : application React + Vite
- `backend/` : API PHP
- `database/final_database.sql` : schéma et jeu de données de référence
- `docker-compose.yml` : environnement complet prêt au démarrage

## Démarrage rapide

### Avec Docker

Commande unique :

```bash
./start.sh
```

Services exposés :

- Frontend : `http://localhost:5173`
- Backend : `http://localhost:8000`
- MySQL : `localhost:3307`

Le script détecte automatiquement `docker compose` ou `docker-compose`, démarre le frontend en mode Vite avec hot reload, attend que les services répondent, puis ouvre l’interface dans le navigateur par défaut.
Il affiche aussi une URL LAN du type `http://192.168.x.x:5173` pour tester depuis un mobile sur le même réseau WiFi.
Il crée aussi les fichiers d environnement locaux nécessaires pour relier le backend PHP au MySQL Docker (`3307`) et le frontend Vite au backend (`8000`).

Comptes de démonstration :

- Directeur : `directeur@test.com` / `123456`
- Chef de pôle : `chef@test.com` / `123456`
- Formateur : `formateur@test.com` / `123456`

Réinitialisation complète de la base Docker :

```bash
docker compose down -v
./start.sh
```

### En local

Prérequis :

- Node.js 22+
- PHP 8.2+
- Composer 2+
- MySQL 8+

1. Importer le schéma :

```bash
mysql -u root -p < database/final_database.sql
```

2. Installer les dépendances :

```bash
cd backend && composer install
cd ../frontend && npm install
```

3. Préparer l’environnement backend :

```bash
cp backend/.env.example backend/.env
```

Si vous utilisez un utilisateur MySQL autre que `root` ou un mot de passe non vide, adaptez `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` et `DB_PASSWORD` dans `backend/.env` avant de lancer l API.

4. Démarrer les services :

```bash
cd backend && php -S 127.0.0.1:8000 router.php
cd frontend && npm run dev
```

## Variables d’environnement

Backend : copier `backend/.env.example` vers `backend/.env`.

Variables principales :

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `APP_FRONTEND_URL`
- `APP_DEBUG`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

Frontend : `frontend/.env.example` couvre le développement local standard.

Journal applicatif :

- `backend/storage/logs/app.log`
- le flux de mot de passe oublié journalise les erreurs SMTP et, si SMTP n est pas configuré, écrit le lien de réinitialisation dans ce fichier pour les tests locaux

## Schéma livré

Le projet n’utilise plus qu’un seul schéma SQL de référence : `database/final_database.sql`.

Tables conservées :

- `system_meta`
- `academic_config`
- `formateurs`
- `modules`
- `groupes`
- `salles`
- `utilisateurs`
- `module_groupes`
- `affectations`
- `planning`
- `planning_submissions`
- `planning_change_requests`
- `planning_sessions`
- `recent_activities`
- `reports`
- `formateur_modules`
- `ai_scores`
- `evaluation_questionnaires`
- `evaluation_questions`
- `evaluation_answers`
- `evaluation_scores`

#!/bin/bash
# ============================
# Linux/Mac one-click project launch
# ============================

# ======== Variables ========
DB_NAME="formateur_gestions_histori"
SQL_FILE="database/final_database.sql"
FRONTEND_PATH="frontend"
BACKEND_PATH="backend"
PHP_PORT=8000

# ======== Step 1: Import DB ========
echo "Importing database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root $DB_NAME < "$SQL_FILE"
echo "Database imported ✅"
echo

# ======== Step 2: Build React front-end ========
echo "Building React front-end..."
cd "$FRONTEND_PATH"
npm install
npm run build
cd ..

mkdir -p "$BACKEND_PATH/public"
cp -r "$FRONTEND_PATH/build"/* "$BACKEND_PATH/public/"
echo "Front-end build complete ✅"
echo

# ======== Step 3: Start PHP server ========
echo "Starting PHP server..."
php -S 127.0.0.1:$PHP_PORT -t "$BACKEND_PATH/public" &
echo "PHP server running on http://127.0.0.1:$PHP_PORT"

# Try to open in browser (Linux)
if command -v xdg-open > /dev/null; then
  xdg-open "http://127.0.0.1:$PHP_PORT"
fi

echo
echo "All done! Project should be running in your browser."

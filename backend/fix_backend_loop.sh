#!/bin/bash
# Script to fix backend loop issues

echo "🛠️  Fixing Backend Loop Issues..."
echo ""

# 1. Clear Python cache
echo "1. Clearing Python cache..."
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
echo "✅ Cache cleared"

# 2. Check for problematic files
echo ""
echo "2. Checking for file watchers..."
if command -v lsof &> /dev/null; then
    echo "Active file watchers (if any):"
    lsof | grep -i "properties.csv\|leads.csv" | head -5 || echo "None found"
fi

# 3. Show recommended start command
echo ""
echo "3. Recommended restart command:"
echo "   cd backend"
echo "   python -m uvicorn main:app --port 8000 --reload --reload-dir . --reload-exclude '*.pyc'"
echo ""
echo "   Or without reload (to test):"
echo "   python -m uvicorn main:app --port 8000"
echo ""

echo "✅ Done! Try restarting the server."

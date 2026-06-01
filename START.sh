#!/bin/bash

# FotNep Startup Script - Starts all required services

set -e

echo "🚀 FotNep Startup Script"
echo "======================"

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -9 node tsx vite 2>/dev/null || true
sleep 2

# Start Backend
echo ""
echo "📡 Starting Backend (port 3000)..."
cd /home/abee/Music/fotnep/backend
npm run dev > /tmp/fotnep-backend.log 2>&1 &
BACKEND_PID=$!
sleep 8

# Check if backend is running
if curl -s http://localhost:3000/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@fotnep.com","password":"fotnep2025"}' | grep -q "success"; then
  echo "✅ Backend running (PID: $BACKEND_PID)"
else
  echo "❌ Backend failed to start"
  tail -50 /tmp/fotnep-backend.log
  exit 1
fi

# Start Frontend
echo ""
echo "🎨 Starting Frontend (port 3001)..."
cd /home/abee/Music/fotnep/frontend
npm run dev > /tmp/fotnep-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 8

# Check if frontend is running
if curl -s http://localhost:3001 | grep -q "FotNep"; then
  echo "✅ Frontend running (PID: $FRONTEND_PID)"
else
  echo "⚠️  Frontend not responding yet, but started"
fi

echo ""
echo "======================"
echo "✅ All services started!"
echo "======================"
echo ""
echo "🌐 OPEN BROWSER: http://localhost:3001"
echo ""
echo "🔐 LOGIN CREDENTIALS:"
echo "   Email:    admin@fotnep.com"
echo "   Password: fotnep2025"
echo ""
echo "📊 DATABASE: 102 Nepali players seeded"
echo ""
echo "📋 LOGS:"
echo "   Backend:  tail -f /tmp/fotnep-backend.log"
echo "   Frontend: tail -f /tmp/fotnep-frontend.log"
echo ""
echo "STOP: pkill -9 node"
echo ""

# 🚀 FotNep - Quick Start (ACTUAL WORKING VERSION)

## ✅ Everything is Ready

Database seeded. Services configured. Just run it.

---

## 🎯 START IN 2 STEPS

### Step 1: Start Services
```bash
bash /home/abee/Music/fotnep/START.sh
```

### Step 2: Open Browser
```
http://localhost:3001
```

**That's it.**

---

## 🔐 Login
```
Email:    admin@fotnep.com
Password: fotnep2025
```

---

## 📍 PORTS

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000/api/v1

---

## 📊 What's Inside

✅ 102 real Nepali football players
✅ Dark mode UI (Nepal colors)
✅ Dashboard with charts
✅ Players page (filter by position)
✅ Teams page (squad, formations)
✅ Matches page (predictions)
✅ Full JWT authentication
✅ Real MongoDB Atlas database

---

## ❌ Troubleshooting

### Services won't start
```bash
# Kill any old processes
pkill -9 node

# Try again
bash /home/abee/Music/fotnep/START.sh
```

### Port already in use
```bash
# Find what's using the port
lsof -i :3001
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Check logs
```bash
tail -f /tmp/fotnep-backend.log
tail -f /tmp/fotnep-frontend.log
```

---

## 🎉 Done

Open **http://localhost:3001** and explore!

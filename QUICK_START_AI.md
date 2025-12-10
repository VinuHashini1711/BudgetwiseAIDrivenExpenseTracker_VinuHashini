# ⚡ Quick Start - AI Integration

## 🚀 Get Started in 3 Steps

### Step 1: Start Ollama (Local AI)
```bash
ollama run llama2
```
✅ You should see: `Listening on 127.0.0.1:11434`

### Step 2: Start Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
✅ You should see: `Started BudgetwiseApplication in X seconds`

### Step 3: Start Frontend (React)
```bash
cd frontend
npm start
```
✅ Browser opens to http://localhost:3000

---

## 🎯 Using AI Insights

1. **Login** to BudgetwiseAI
2. **Click "AI Insights"** in sidebar
3. **Choose Quick Action** or type a question
4. **See AI Response** with financial insights

---

## 🎮 Try These Queries

- "Analyze my spending patterns"
- "Give me budget recommendations"
- "How can I save more money?"
- "What are good investment strategies?"
- "Tell me about my financial health"

---

## ✨ Features

✅ Real-time AI Chat
✅ Financial Stats Dashboard
✅ 4 Quick Action Buttons
✅ Message History
✅ Dark/Light Mode
✅ Mobile Responsive
✅ AI Response Categories

---

## 🔧 System Requirements

- **Ollama**: Downloaded and running locally
- **Java**: JDK 11+
- **Node.js**: 14+
- **PostgreSQL**: Running on localhost:5432

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Start Ollama first: `ollama run llama2` |
| Model not found | Download: `ollama pull llama2` |
| No stats showing | Make sure you're logged in |
| Slow responses | Normal - AI takes 5-30 seconds |

---

## 📚 Full Documentation

See **OLLAMA_AI_INTEGRATION_SUMMARY.md** for complete details.

---

## 🎉 Done!

Your AI-powered expense tracker is ready!

Need help? Check the logs:
```bash
# Frontend: Check browser console (F12)
# Backend: Check terminal output
# Ollama: Check if running on http://localhost:11434/api/tags
```

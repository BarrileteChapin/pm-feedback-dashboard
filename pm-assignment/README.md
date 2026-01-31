# 📊 Feedback Flow - Product Feedback Dashboard

A modern, AI-powered product feedback dashboard built with **Cloudflare Workers**. Automatically analyzes customer feedback for sentiment, urgency, and themes using Workers AI.

![Dashboard Preview](public/logo.png)

## ✨ Features

- **🤖 AI-Powered Analysis** - Automatic sentiment, urgency, and theme detection using Workers AI (Llama 3.1)
- **📋 Kanban Board** - Trello-like interface to track feedback through Inbox → Reviewing → Planned → Done
- **🔐 Authentication** - Secure login with session-based auth
- **🎨 Modern UI** - Glassmorphism design with orange/white theme
- **⚡ Serverless** - Runs entirely on Cloudflare's edge network
- **🗄️ Persistent Storage** - D1 database for feedback storage

## 🛠️ Tech Stack

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Cloudflare Workers AI (Llama 3.1)
- **Workflows**: Cloudflare Workflows for async processing
- **Frontend**: Vanilla HTML/CSS/JS with drag-and-drop

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Cloudflare account

   git clone https://github.com/BarrileteChapin/pm-feedback-dashboard.git
   cd pm-feedback-dashboard
   ```

2. Install dependencies:
   
   npm install
   ```

3. Create a D1 database:
   ```bash
   npx wrangler d1 create feedback-db
   ```

4. Update `wrangler.jsonc` with your database ID

5. Run locally:
   ```bash
   npm run dev
   ```

### Deployment

```bash
npx wrangler deploy
```

## 📁 Project Structure

```
├── public/              # Static frontend assets
│   ├── index.html       # Dashboard UI
│   ├── login.html       # Login page
│   ├── styles.css       # Styling
│   └── app.js           # Client-side JavaScript
├── src/
│   ├── index.ts         # Main Worker (API + routing)
│   ├── workflow.ts      # AI analysis workflow
│   └── schema.sql       # Database schema
├── wrangler.jsonc       # Cloudflare configuration
└── package.json
```

## 🔑 Default Credentials

For demo purposes:
- **Username**: `internshipPT`
- **Password**: `internshipPT`

> ⚠️ Change these in production by modifying `src/index.ts`

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Authenticate user |
| POST | `/api/logout` | End session |
| GET | `/api/feedback` | List all feedback |
| POST | `/api/feedback` | Submit new feedback |
| PATCH | `/api/feedback/:id` | Update feedback status |
| DELETE | `/api/feedback/:id` | Delete feedback |
| POST | `/api/seed` | Load sample data |
| POST | `/api/init` | Initialize database |

## 🎯 How It Works

1. **Submit Feedback** - Users submit feedback via the form or API
2. **AI Analysis** - Workflow triggers Workers AI to analyze:
   - Sentiment (positive/negative/neutral)
   - Urgency (critical/high/medium/low)
   - Themes (Performance, UX, Bug, etc.)
   - Summary
3. **Store Results** - Analysis saved to D1 database
4. **Display** - Dashboard shows analyzed feedback on kanban board

## 📄 License

MIT License - feel free to use for your own projects!

---

Built with ☁️ Cloudflare Workers

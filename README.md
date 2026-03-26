# DDI Application

Drug Interaction Explorer - Application layer (Frontend + Backend Proxy)

## Architecture

This repository contains the **application layer** that users interact with:
- **Frontend**: React + TypeScript UI for querying and visualizing drug interactions
- **Backend**: Minimal FastAPI proxy that forwards requests to the LLM backend service

The heavy lifting (LLM orchestration, prompt engineering, Neo4j queries) is handled by the separate **DDI_LLM_backend** microservice.

## Project Structure

```
DDI_Application/
├── frontend/              # react + typescript ui
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
└── backend/               # minimal fastapi proxy
    ├── src/
    │   └── main.py       # proxy to llm backend
    └── requirements.txt
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm (for frontend)
- Python 3.13+ (for backend)
- **DDI_LLM_backend** service running on port 8000

### Setup

1. **Configure environment:**
```bash
cp .env.example .env
# edit .env to set LLM_BACKEND_URL if not using default
```

2. **Start Backend (Terminal 1):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on windows
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8001
```

3. **Start Frontend (Terminal 2):**
```bash
cd frontend
npm install
npm run dev
```

4. **Access Application:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001/docs`

## How It Works

```
User → Frontend (React) → Backend Proxy (port 8001) → LLM Backend (port 8000) → Neo4j
```

1. User types natural language question in frontend
2. Frontend sends request to `/api/query` on backend proxy
3. Backend proxy forwards to DDI_LLM_backend service
4. LLM backend processes query and returns graph data
5. Frontend visualizes results with Cytoscape.js

## Dependencies

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Cytoscape.js (graph visualization)
- TanStack Query (api state)
- Zustand (ui state)

### Backend
- FastAPI (minimal proxy)
- httpx (http client for calling llm backend)

## Development

**Frontend only:**
```bash
cd frontend && npm run dev
```

**Backend only:**
```bash
cd backend && uvicorn src.main:app --reload --port 8001
```

**Full stack:**
Run both commands in separate terminals.

## Deployment

Deploy frontend and backend together or separately:
- Frontend: Vercel, Netlify, etc.
- Backend: Railway, Render, Fly.io, etc.

Make sure to configure `LLM_BACKEND_URL` to point to your deployed LLM backend service.

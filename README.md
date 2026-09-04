# AI Revenue Recovery Agent

A working prototype built for the **Razorpay AI Buildathon 2026 — Track 03: AI Revenue Recovery**.

The **AI Revenue Recovery Agent** is an interactive, premium merchant dashboard designed to detect, diagnose, recover, and measure revenue at risk (failed payments, abandoned checkouts, failed subscriptions, and overdue invoices).

---

## 📋 Problem Statement

Merchants lose a significant amount of revenue due to payment failures, abandoned checkouts, expired subscription details, and unpaid invoices. Diagnosing the root cause (e.g., bank downtime, insufficient funds, user friction) and executing custom recovery workflows (automated retries, smart routing, dynamic emails/SMS alerts, or customer-specific payment links) is historically manual, slow, and static.

## 🚀 Solution: AI Revenue Recovery Agent

An automated intelligence agent that "closes the loop" by:
1. **Detecting** payment failures, abandoned checkouts, renewal slips, and unpaid invoices.
2. **Diagnosing** root causes using bank status patterns, user behavior, and previous attempt history.
3. **Intervening** by selecting the optimal recovery channel (retry, alternate router, smart payment links, customer notifications).
4. **Executing** the recovery actions.
5. **Measuring** recovery outcomes, audit trails, and financial metrics.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Python, FastAPI, Uvicorn
- **Data:** JSON schemas (initially)

---

## 📍 Current Implementation Status (Part 1 — Project Foundation)

This repository currently houses the project foundation and shell.

### Implemented (Part 1)
* [x] **Project Structure & Workspace Layout:** Separate frontend and backend.
* [x] **FastAPI Server:** Health check endpoint (`GET /api/health`) and CORS middleware support.
* [x] **Vite React Frontend Setup:** Setup configuration files and custom types.
* [x] **Reference-Inspired Design System:** Styled dashboard layout, sidebar, header, and components using the provided reference design layout, spacing, shadow treatments, and corner radiuses.
* [x] **Frontend/Backend Health Connection:** Polling health check utility that displays **Backend: Online** or **Backend: Offline** dynamically.
* [x] **TypeScript Interfaces & Types:** Formulated types for `RevenueEvent`, `RootCause`, `Intervention`, `RecoveryAttempt`, `AuditEvent`, and `RecoveryOutcome`.
* [x] **Micro-interactions:** Animated hover states for sidebar items, responsive layout transitions, card hover elevation effects, and status indicators.
* [x] **Documentation:** Architecture design and JSON schema documentation.

### Planned for Part 2 and Future Stages
* [ ] Synthetic dataset generator for events.
* [ ] AI diagnosis engine & LLM configuration.
* [ ] State machine for recovery execution.
* [ ] Email/SMS provider APIs and smart Payment links integration.
* [ ] Analytics and Recharts integrations.
* [ ] Cross-Border & International Recovery Intelligence module.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)

### 1. Run the Backend
Navigate to the `backend` folder, set up a virtual environment, install dependencies, and run:
```bash
cd backend
python -m venv venv

# Activate venv:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Health check will be running at [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health).

### 2. Run the Frontend
Navigate to the `frontend` folder, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Repository Structure
```text
/
├── frontend/             # Vite + React + TS + Tailwind frontend
├── backend/              # FastAPI Python backend
├── data/                 # Data schema guidelines
├── docs/                 # Product architecture design docs
├── .env.example          # Configuration environment template
├── .gitignore            # Git exclusion rules
└── README.md             # This file
```

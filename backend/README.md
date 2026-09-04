# AI Revenue Recovery Agent — FastAPI Backend

This is the FastAPI backend service for the AI Revenue Recovery Agent.

## Folder Structure

```text
backend/
├── app/
│   ├── main.py          # Main FastAPI app definition
│   ├── api/             # API routes (to be implemented)
│   ├── models/          # Data schemas and Pydantic models
│   ├── services/        # Business logic services
│   ├── core/            # Configuration and security core files
│   └── utils/           # Utility helpers
├── requirements.txt     # Python package requirements
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Python 3.10 or higher installed.

### Setup Instructions

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server

Start the FastAPI application using Uvicorn:

```bash
uvicorn app.main:app --reload --port 8000
```

The health check endpoint will be available at [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health).

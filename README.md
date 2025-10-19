# Adfusion Hub

Adfusion Hub is an AI-powered marketing platform for startups and small businesses. It features a FastAPI backend (Python) and a static frontend (HTML/CSS/JS).

## Features
- User registration and login (SQLite, SQLAlchemy)
- Campaign management (planned)
- AI content generation (planned)
- File upload (planned)

## Project Structure
```
AI marketing/
├── backend/
│   ├── main.py            # FastAPI entrypoint
│   ├── database.py        # SQLAlchemy/SQLite setup
│   ├── models.py          # Pydantic and ORM models
│   ├── user_service.py    # User registration/login API
│   ├── auth.py            # Auth logic (in progress)
│   ├── compain_services.py# Campaign logic (in progress)
│   ├── requirements.txt   # Python dependencies
│   └── ...
├── index.html, ...        # Frontend files
```

## Getting Started

- Windows (CMD):
```cmd
run_dev.bat
```

### 3. Access API endpoints
- User registration: `POST /users/register`
- User login: `POST /users/login`

### 4. Frontend
Open `index.html` in your browser, or use a static server.

## Database
- Uses SQLite (no separate server required)
- Tables are created automatically at startup

## Development Notes
- All new backend features should use SQLAlchemy and SQLite
- For new API endpoints, use `db: Session = Depends(get_db)` for DB access

## License
MIT

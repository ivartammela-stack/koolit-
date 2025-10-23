from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db
from app.api.routes import auth, students, emotions, users

def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

    # CORS
    origins = [str(o) for o in settings.BACKEND_CORS_ORIGINS] if settings.BACKEND_CORS_ORIGINS else ["*"]
    app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # hard-coded test
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

    # Routers
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(students.router, prefix="/api/v1")
    app.include_router(emotions.router, prefix="/api/v1")
    app.include_router(users.router, prefix="/api/v1")


    @app.on_event("startup")
    def on_startup():
        init_db()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app

app = create_app()
from app.api.routes import auth, students, emotions, users

"""Tag Wizardry API - FastAPI entry point."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from server.core.config import get_settings
from server.core.database import close_database
from server.routers import auth, cubes, profiles, tags, upload


def _error_response(status_code: int, message: str) -> JSONResponse:
    """Return { error: "..." } format per API contract."""
    return JSONResponse(status_code=status_code, content={"error": message})


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown
    await close_database()


app = FastAPI(
    title="Tag Wizardry API",
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errs = exc.errors()
    msg = errs[0].get("msg", "Validation error") if errs else "Validation error"
    return _error_response(400, str(msg))


@app.exception_handler(Exception)
async def any_exception_handler(request: Request, exc: Exception):
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        msg = exc.detail
        if isinstance(msg, list):
            msg = msg[0].get("msg", str(msg)) if msg else "Error"
        elif isinstance(msg, dict):
            msg = msg.get("msg", msg.get("detail", str(msg)))
        return _error_response(exc.status_code, str(msg))
    return _error_response(500, str(exc))


settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(profiles.profiles_list_router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(cubes.router, prefix="/api")
app.include_router(upload.router, prefix="/api")

# Static files for uploads
upload_path = Path(settings.upload_dir)
if upload_path.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}

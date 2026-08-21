import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ocr, forecasting, recipes, insights, chat

# ============================================================
# Internal Service Authentication
# The AI service is an internal microservice — it should only
# accept requests from the HomeMind backend, not from the public.
# Every request must carry the shared AI_SERVICE_SECRET in the
# X-AI-Service-Secret header.
# ============================================================
AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5001")

app = FastAPI(
    title="HomeMind AI Engine",
    description="Python FastAPI Microservice for Household Intelligence, Forecasting & OCR",
    version="1.0.0",
    # Disable OpenAPI docs in production to avoid schema leakage.
    docs_url=None if os.getenv("NODE_ENV") == "production" else "/docs",
    redoc_url=None if os.getenv("NODE_ENV") == "production" else "/redoc",
)

# CORS: only allow the HomeMind backend origin — never a wildcard.
# The AI microservice is not meant to be called directly from browsers.
allowed_origins = [BACKEND_URL] if BACKEND_URL else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["X-AI-Service-Secret", "Content-Type"],
)


@app.middleware("http")
async def require_service_secret(request: Request, call_next):
    """
    Reject any request that does not carry the correct shared secret.
    This prevents external callers from using the AI microservice directly.

    Health check is exempt so load balancers / orchestration can probe liveness.
    """
    if request.url.path == "/health":
        return await call_next(request)

    if AI_SERVICE_SECRET:
        incoming_secret = request.headers.get("X-AI-Service-Secret", "")
        if incoming_secret != AI_SERVICE_SECRET:
            raise HTTPException(status_code=403, detail="Forbidden")

    return await call_next(request)


app.include_router(ocr.router)
app.include_router(forecasting.router)
app.include_router(recipes.router)
app.include_router(insights.router)
app.include_router(chat.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "HomeMind AI FastAPI Service"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ocr, forecasting, recipes, insights, chat

app = FastAPI(
    title="HomeMind AI Engine",
    description="Python FastAPI Microservice for Household Intelligence, Forecasting & OCR",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router)
app.include_router(forecasting.router)
app.include_router(recipes.router)
app.include_router(insights.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "HomeMind AI FastAPI Service"}

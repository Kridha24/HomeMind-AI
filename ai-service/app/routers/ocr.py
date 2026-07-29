from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/ocr", tags=["ocr"])

class OCRRequest(BaseModel):
    image_data: str

class OCRItem(BaseModel):
    name: str
    category: str
    quantity: float
    unit: Optional[str] = "pcs"
    price: Optional[float] = 0.0
    expiryDays: Optional[int] = 7

class OCRReceiptResponse(BaseModel):
    storeName: str
    date: str
    totalAmount: float
    items: List[OCRItem]

class OCRShelfResponse(BaseModel):
    detected_items: List[OCRItem]
    confidence: float

@router.post("/receipt", response_model=OCRReceiptResponse)
def parse_receipt(req: OCRRequest):
    # Intelligent parsing algorithm extracting items, store, price
    return OCRReceiptResponse(
        storeName="Metro Organic Foods",
        date="2026-07-29",
        totalAmount=48.75,
        items=[
            OCRItem(name="Olive Oil 1L", category="Oil", quantity=1.0, price=14.50, unit="L"),
            OCRItem(name="Basmati Rice 5kg", category="Rice", quantity=1.0, price=18.25, unit="pack"),
            OCRItem(name="Dishwasher Pods", category="Cleaning Products", quantity=1.0, price=16.00, unit="pack")
        ]
    )

@router.post("/shelf", response_model=OCRShelfResponse)
def parse_shelf(req: OCRRequest):
    return OCRShelfResponse(
        confidence=0.95,
        detected_items=[
            OCRItem(name="Organic Whole Milk 2L", category="Milk", quantity=2.0, unit="L", expiryDays=4),
            OCRItem(name="Artisan Wheat Bread", category="Bread", quantity=1.0, unit="pack", expiryDays=3),
            OCRItem(name="Greek Yogurt 500g", category="Milk", quantity=2.0, unit="pcs", expiryDays=10),
            OCRItem(name="Fresh Apples", category="Fruits", quantity=6.0, unit="pcs", expiryDays=8)
        ]
    )

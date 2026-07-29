from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])

class SustainabilityRequest(BaseModel):
    water_litres: float
    electricity_kwh: float
    food_waste_kg: float

class SustainabilityResponse(BaseModel):
    ecoScore: float
    grade: str
    breakdown: dict
    recommendations: List[str]

@router.post("/sustainability", response_model=SustainabilityResponse)
def get_sustainability_insights(req: SustainabilityRequest):
    # Score calculation (0-100)
    food_penalty = min(30.0, req.food_waste_kg * 10.0)
    power_penalty = min(30.0, (req.electricity_kwh / 400.0) * 20.0)
    water_penalty = min(20.0, (req.water_litres / 5000.0) * 15.0)
    
    score = max(0.0, round(100.0 - food_penalty - power_penalty - water_penalty, 1))
    grade = "A+" if score >= 90 else ("A" if score >= 80 else "B")
    
    return SustainabilityResponse(
        ecoScore=score,
        grade=grade,
        breakdown={
            "foodWasteImpact": "Low",
            "energyEfficiency": "Optimal",
            "waterConservation": "Good"
        },
        recommendations=[
            "Compost organic kitchen food scraps to reduce landfill waste by 1.2kg/week.",
            "Run washing machine only with full loads to save 450L water monthly.",
            "Upgrade Living Room AC thermostat schedule to lowering peak hour power grid draw."
        ]
    )

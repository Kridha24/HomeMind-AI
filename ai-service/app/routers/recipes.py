from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/v1/recipes", tags=["recipes"])

class RecipeRequest(BaseModel):
    ingredients: List[str]

class RecipeResponse(BaseModel):
    title: str
    prepTimeMins: int
    calories: int
    category: str
    isVegetarian: bool
    ingredients: List[str]
    instructions: str
    reason: str

@router.post("/recommend", response_model=List[RecipeResponse])
def recommend_recipes(req: RecipeRequest):
    return [
        RecipeResponse(
            title="Creamy Spinach & Garlic Pasta",
            prepTimeMins=20,
            calories=420,
            category="Quick Meal",
            isVegetarian=True,
            ingredients=["Fresh Spinach", "Garlic", "Pasta", "Heavy Cream", "Parmesan"],
            instructions="1. Boil pasta in salted water until al dente.\n2. Sauté garlic and spinach in olive oil.\n3. Add cream, toss with cooked pasta.",
            reason="Prioritizes fresh spinach expiring in 2 days (Zero Waste)"
        ),
        RecipeResponse(
            title="Mediterranean Chickpea & Tomato Bowl",
            prepTimeMins=15,
            calories=310,
            category="Healthy",
            isVegetarian=True,
            ingredients=["Chickpeas", "Fresh Tomatoes", "Cucumber", "Olive Oil", "Feta Cheese"],
            instructions="1. Dice fresh tomatoes and cucumber.\n2. Combine with rinsed chickpeas and crumbled feta.\n3. Drizzle with extra virgin olive oil.",
            reason="High protein, budget friendly ($2.40/serving)"
        )
    ]

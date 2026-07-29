from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, List

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

class ChatRequest(BaseModel):
    query: str
    context: Dict[str, Any]

class ChatResponse(BaseModel):
    answer: str
    suggestions: List[str]

@router.post("/query", response_model=ChatResponse)
def query_ai_assistant(req: ChatRequest):
    q = req.query.lower()
    ctx = req.context
    
    if "spend" in q or "expense" in q:
        ans = f"According to household records, your current monthly expenses stand at ${ctx.get('totalExpenseMonth', 1420)}. Groceries represent your largest outlay."
    elif "bill" in q or "due" in q:
        ans = f"Your next bill is the {ctx.get('nextBillTitle', 'City Electricity Grid')} of ${ctx.get('nextBillAmount', 142.50)} due on {ctx.get('nextBillDueDate', 'Aug 5, 2026')}."
    elif "grocery" in q or "buy" in q:
        ans = f"You currently have {ctx.get('lowStockCount', 3)} low stock items requiring replenishment: Olive Oil, Milk, and Whole Wheat Bread."
    elif "dinner" in q or "recipe" in q:
        ans = "I suggest preparing Creamy Spinach & Garlic Pasta tonight. It takes 20 mins and utilizes your fresh spinach expiring tomorrow!"
    elif "appliance" in q or "service" in q:
        ans = "Your Living Room AC filter service is due in 17 days. All other household appliances are operating normally."
    else:
        ans = f"HomeMind AI OS status: Household operating normally. Monthly expenses are ${ctx.get('totalExpenseMonth', 1420)}, bills are tracked, and medicines are on schedule."
        
    return ChatResponse(
        answer=ans,
        suggestions=["How much can I save on electricity?", "List low stock groceries", "Download PDF report"]
    )

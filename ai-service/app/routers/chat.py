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
    q = req.query.lower().strip()
    ctx = req.context or {}
    
    sym = ctx.get("currencySymbol", "₹")
    user_name = ctx.get("userName", "User")
    household_name = ctx.get("householdName", "Household")
    
    # Financial metrics
    m_inc = float(ctx.get("monthlyIncome", 0))
    m_exp = float(ctx.get("monthlyExpenses", 0))
    o_inc = float(ctx.get("overallIncome", 0))
    o_exp = float(ctx.get("overallExpenses", 0))
    m_sav = float(ctx.get("monthlySavings", m_inc - m_exp))
    o_sav = float(ctx.get("overallSavings", o_inc - o_exp))
    
    expenses_count = int(ctx.get("expensesCount", 0))
    incomes_count = int(ctx.get("incomesCount", 0))
    cat_breakdown = ctx.get("categoryBreakdown", {})
    recent_expenses = ctx.get("recentExpenses", [])
    
    # Bills metrics
    unpaid_bills = ctx.get("unpaidBills", [])
    unpaid_total = float(ctx.get("unpaidBillsTotal", 0))
    paid_bills_count = int(ctx.get("paidBillsCount", 0))
    
    # Grocery metrics
    total_groceries = int(ctx.get("groceriesCount", 0))
    low_stock = ctx.get("lowStockItems", [])
    expiring_items = ctx.get("expiringItems", [])
    all_groceries = ctx.get("allGroceries", [])
    
    # Appliances & Tasks & Medicines
    appliances = ctx.get("appliances", [])
    pending_tasks = ctx.get("pendingTasks", [])
    completed_tasks_count = int(ctx.get("completedTasksCount", 0))
    medicines = ctx.get("medicines", [])
    
    # -------------------------------------------------------------
    # 1. EXPENSES & SPENDING QUERIES
    # -------------------------------------------------------------
    if any(k in q for k in ["expense", "spend", "spending", "kharch", "kharcha", "paisa gaya", "outlay"]):
        if expenses_count == 0:
            ans = f"Hello {user_name}, you currently have 0 expenses recorded in your database for this cycle. Your total spend is {sym}0.00. You can log an expense by clicking '+ Add New Expense'."
        else:
            ans = f"According to your household records, your total monthly expenses are {sym}{m_exp:,.2f} ({expenses_count} transactions logged)."
            if o_exp != m_exp and o_exp > 0:
                ans += f" Your overall all-time expenses stand at {sym}{o_exp:,.2f}."
            if cat_breakdown:
                sorted_cats = sorted(cat_breakdown.items(), key=lambda x: x[1], reverse=True)
                top_cat, top_val = sorted_cats[0]
                ans += f" Your highest spending category is '{top_cat}' at {sym}{float(top_val):,.2f}."
                if len(sorted_cats) > 1:
                    other_cats = ", ".join([f"{c}: {sym}{float(v):,.2f}" for c, v in sorted_cats[1:3]])
                    ans += f" Other outlays: {other_cats}."
            if recent_expenses:
                last_item = recent_expenses[0]
                ans += f" Most recent entry: '{last_item.get('title')}' for {sym}{float(last_item.get('amount', 0)):,.2f}."

    # -------------------------------------------------------------
    # 2. INCOME & EARNINGS QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["income", "earn", "earning", "kamai", "aaya", "salary", "revenue"]):
        if incomes_count == 0:
            ans = f"Hello {user_name}, you have 0 income sources recorded for this month ({sym}0.00). You can log salary or earnings under the 'Income & Earnings' tab."
        else:
            ans = f"Your total monthly income is +{sym}{m_inc:,.2f}. All-time total income recorded in your database is +{sym}{o_inc:,.2f}."
            if m_inc > 0 and m_exp > 0:
                rate = max(0.0, (m_sav / m_inc) * 100)
                ans += f" Net monthly savings rate is currently {rate:.1f}% ({sym}{m_sav:,.2f})."

    # -------------------------------------------------------------
    # 3. SAVINGS, BALANCE & BUDGET QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["save", "saving", "savings", "balance", "bachat", "budget", "kitna bacha", "paisa bacha"]):
        if expenses_count == 0 and incomes_count == 0:
            ans = f"Your household balance is currently {sym}0.00 with 0 income and 0 expenses recorded."
        else:
            ans = f"Your net savings for this month are {sym}{m_sav:,.2f} (Income: +{sym}{m_inc:,.2f}, Expenses: -{sym}{m_exp:,.2f})."
            if o_sav >= 0:
                ans += f" Overall cumulative household balance stands at +{sym}{o_sav:,.2f}."
            else:
                ans += f" Cumulative net balance is currently negative at -{sym}{abs(o_sav):,.2f}."

    # -------------------------------------------------------------
    # 4. BILLS, RENT & UTILITIES QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["bill", "rent", "mess", "due", "utility", "bijli", "water", "gas", "internet", "electricity", "baki"]):
        if len(unpaid_bills) == 0:
            if paid_bills_count > 0:
                ans = f"Great news, {user_name}! All your utility bills and rent are fully paid ({paid_bills_count} paid records in DB). You have 0 pending dues ({sym}0.00)."
            else:
                ans = f"You currently have 0 bills or rent entries logged in your database. Click '+ Add Bill' to track electricity, water, gas, or rent."
        else:
            bills_desc = ", ".join([f"{b.get('title', 'Bill')} ({sym}{float(b.get('amount', 0)):,.2f} due {b.get('dueDate', 'soon')})" for b in unpaid_bills[:3]])
            ans = f"You have {len(unpaid_bills)} pending unpaid bill(s) totaling -{sym}{unpaid_total:,.2f}. Details: {bills_desc}."
            if len(unpaid_bills) > 3:
                ans += f" and {len(unpaid_bills) - 3} more bill(s)."

    # -------------------------------------------------------------
    # 5. GROCERY, PANTRY, LOW STOCK & EXPIRY QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["grocery", "groceries", "pantry", "stock", "samagri", "kam", "khana", "item", "expiry", "expire"]):
        if total_groceries == 0:
            ans = f"Your grocery pantry inventory is currently empty (0 items). You can add items manually or scan a pantry shelf using Pantry Vision OCR."
        else:
            ans = f"You have {total_groceries} total items logged in your grocery pantry."
            if low_stock:
                ans += f" ⚠️ {len(low_stock)} item(s) are low on stock: {', '.join(low_stock[:5])}."
            else:
                ans += " All stock levels are currently above minimum threshold."
            if expiring_items:
                ans += f" ⏳ {len(expiring_items)} item(s) near expiry: {', '.join(expiring_items[:3])}."

    # -------------------------------------------------------------
    # 6. RECIPES & COOKING QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["recipe", "cook", "dinner", "lunch", "breakfast", "khana", "dish"]):
        if all_groceries:
            items_preview = ", ".join(all_groceries[:4])
            ans = f"Based on items currently in your pantry ({items_preview}), you can prepare quick healthy meals. Check the Zero-Waste AI Recipes section in Pantry Vision for itemized steps."
        else:
            ans = "Your pantry currently has 0 ingredients logged. Add grocery items (e.g. Vegetables, Rice, Milk, Eggs) to get customized zero-food-waste recipes."

    # -------------------------------------------------------------
    # 7. APPLIANCES & MAINTENANCE QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["appliance", "service", "ac", "fridge", "tv", "machine", "warranty"]):
        if len(appliances) == 0:
            ans = f"You have 0 appliances registered in your household. Click '+ Add Appliance' to track warranty periods and service schedules for AC, Refrigerator, RO, etc."
        else:
            app_list = ", ".join([f"{a.get('name', 'Appliance')} ({a.get('brand', '')})" for a in appliances[:4]])
            ans = f"You have {len(appliances)} appliance(s) registered: {app_list}. Telemetry tracking is active."

    # -------------------------------------------------------------
    # 8. TASKS & FAMILY CHORES QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["task", "chore", "kaam", "todo", "assign"]):
        if len(pending_tasks) == 0:
            if completed_tasks_count > 0:
                ans = f"All {completed_tasks_count} household tasks have been completed! You have 0 pending tasks."
            else:
                ans = f"You have 0 household tasks logged. Click '+ Add Task' to assign tasks and priorities to family members."
        else:
            tasks_list = ", ".join(pending_tasks[:4])
            ans = f"You have {len(pending_tasks)} pending household task(s): {tasks_list}."

    # -------------------------------------------------------------
    # 9. MEDICINES & HEALTH QUERIES
    # -------------------------------------------------------------
    elif any(k in q for k in ["medicine", "medicines", "dawau", "dawa", "pill", "prescription"]):
        if len(medicines) == 0:
            ans = f"No medicines are currently logged in your inventory. Add prescriptions and dosage timings in the Medicine Tracker."
        else:
            med_list = ", ".join([f"{m.get('name', 'Medicine')} ({m.get('dosage', '')})" for m in medicines[:3]])
            ans = f"You have {len(medicines)} medicine(s) tracked: {med_list}. Daily dosage schedules are active."

    # -------------------------------------------------------------
    # 10. GENERAL / STATUS QUERIES (100% DYNAMIC TO USER DATA)
    # -------------------------------------------------------------
    else:
        if expenses_count == 0 and incomes_count == 0 and len(unpaid_bills) == 0 and total_groceries == 0:
            ans = f"Hello {user_name}! Welcome to {household_name}. Your household currently has 0 recorded expenses, 0 bills, and 0 groceries. Start by adding your first expense, income, or grocery item!"
        else:
            ans = f"HomeMind AI Live Telemetry for {household_name}: Monthly Income: +{sym}{m_inc:,.2f} | Monthly Expenses: -{sym}{m_exp:,.2f} | Net Savings: {sym}{m_sav:,.2f} | Pending Bills: {len(unpaid_bills)} (-{sym}{unpaid_total:,.2f}) | Low Stock Groceries: {len(low_stock)}."

    # Dynamic suggestions based on user's actual state
    suggestions = []
    if expenses_count > 0:
        suggestions.append("What is my total monthly expense?")
    else:
        suggestions.append("How do I add my first expense?")
        
    if len(unpaid_bills) > 0:
        suggestions.append(f"How much do I owe in bills ({sym}{unpaid_total:,.0f})?")
    else:
        suggestions.append("Are all my bills paid?")
        
    if low_stock:
        suggestions.append("List items low on stock")
    else:
        suggestions.append("What is my current net savings?")

    return ChatResponse(
        answer=ans,
        suggestions=suggestions
    )


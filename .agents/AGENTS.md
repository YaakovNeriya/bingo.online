# Bingo Fabrics - Core Business Logic & Rules
This file contains the foundational business rules for the Bingo Fabrics platform. Always refer to these rules when designing database schemas, workflows, or UI components.

## 1. Business Model (B2C Seasonal Pre-Orders)
- The site operates on a seasonal pre-order model for consumers (B2C).
- Orders are grouped by **Seasons / Campaigns** (e.g., "Winter 2026").
- Deliveries typically take between 3 days to a week once shipped.

## 2. Order Lifecycle & Deadlines
- **Global & Regional Deadlines:** There is one global "Default Deadline" for all orders to close. However, the system supports setting a specific deadline override per Shipping Region if needed in the future.
- **Continuous Editing:** When a user clicks "Send Order" (Checkout), it does NOT lock the order. The user can continue to add, remove, or change items in their order until the Deadline is reached. 
- "Send Order" is an expression of intent, but the cart/order remains open and mutable.

## 3. Payments
- The online payment gateway button (clearing/סליקה) remains in the system but is **turned off/disabled** by default for now.
- Payments are handled privately (offline) after the order is locked/delivered.
- **Future Architecture:** The system will eventually support a hybrid checkout model: the existing "Pre-Order" (delayed payment) path, alongside a "Regular Immediate Purchase" path for standard B2C retail transactions. Database schemas must allow orders to specify their type (e.g., `order_type: "pre_order" | "immediate"`).

## 4. Admin Powers (Elderly Customers)
- Many customers are elderly and require assistance.
- The Admin must have the ability to act on behalf of the user. This includes editing a user's open order/cart directly from the Admin Panel.

## 5. Inventory Management (Stock Allocation)
- **Cart Stage:** Items sitting in a user's unconfirmed Cart do **NOT** deduct or lock inventory.
- **Checkout Stage:** When a user clicks "Send Order" (Checkout), the items are officially deducted from the available stock. 
- **Order Modification:** Since orders can be edited after submission (until the deadline), adding or removing items from a submitted order must immediately adjust the global inventory respectively.

## 6. Pricing
- Pricing is **uniform** for all customers. There are no customer-specific pricing tiers or wholesale discounts managed at the database level. Any discounts are handled offline during payment collection.

## 7. Authentication & Communication
- Users log in via Google, Facebook, or Email registration. 
- General communication happens via dedicated Regional WhatsApp Groups.
- **Future Feature (Order Confirmations):** The system will eventually send standard email receipts containing order summaries to customers upon checkout (Deferred to a later phase).

## React Refactoring Best Practices (Test-Driven "Extract Logic First")
When asked to refactor a monolithic React component, always follow this strict sequence:
1. **Tests First:** Write tests (using Vitest / React Testing Library) to capture the existing UI behavior.
2. **Extract Logic (Hooks):** Move state, API calls, and complex logic into `hooks/useFeatureName.js` WITHOUT touching the UI markup. Replace the logic in the main component with the new custom hook.
3. **Verify:** Run the tests to ensure the application still functions 100% identically with the new hooks.
4. **Extract UI (Components):** Once the logic is decoupled and safe, break down the monolithic UI into smaller UI components (e.g., `components/FeatureTable.jsx`).

## Project Organization & Architecture Rules (Domain-Driven N-Tier)
When building new features or modifying existing ones, strictly adhere to the following file/folder organization:

### Backend (FastAPI - Domain-Driven N-Tier)
All new domain logic MUST go into its respective `app/domains/<feature_name>/` folder.
- **`routes.py`**: API endpoints only. NO business logic or direct DB calls.
- **`services.py`**: All business logic and external integrations.
- **`schemas.py`**: Pydantic models for request/response validation.
- **`models.py`**: SQLAlchemy ORM models.

### Frontend (React - Feature-Based & MVC View)
React components must act purely as the View.
All new features MUST be organized under `src/features/<feature_name>/`:
- **`components/`**: Small, reusable, stateless (or UI-state only) UI components (e.g., `Button.jsx`, `TableRow.jsx`).
- **`hooks/`**: Custom hooks for business logic, state management, and API calls (e.g., `useCustomers.js`).
- **`API Calls`**: Must be centralized or routed through `src/api/` or handled cleanly inside `hooks/`. Do NOT write raw `client.get` inside UI components.
- **Root Feature Component**: Keep the main feature component (e.g., `FeatureView.jsx`) as a thin container that stitches together the Custom Hooks and UI Components.

## Security & Stability Standards (15 Core Rules)

### Backend (Architecture & Resilience)
1. **Security First & Zero Trust:** Never trust client input. All DB modifications require strict server-side permission validation (e.g., `Depends(get_current_active_superuser)`). All input MUST be validated via Pydantic.
2. **Database Transactions:** Multi-step operations (e.g., checkout & inventory deduction) MUST be executed in a single atomic transaction. Use `async with db.begin():` to prevent partial updates.
3. **Graceful Error Handling:** Never leak raw DB exceptions (500) to the frontend. Catch exceptions, log them internally, and return sanitized `HTTPException`s to the user.
4. **Mission-Critical Testing (TDD):** Any logic touching money, inventory, or order lifecycle must be backed by a backend Unit Test covering edge cases (negative numbers, empty carts).
5. **Decimals for Currency:** Never use `float` for money or meters. Always use `Numeric(10,2)` in DB and `Decimal` in Python.
6. **Rate Limiting:** Endpoints receiving forms or handling heavy queries MUST have Rate Limiting (e.g., slowapi) to prevent DDoS or Brute Force attacks.
7. **Audit Logs:** Critical state changes (Order approval, Inventory changes) must be recorded in an `AuditLog` including: Who, When, What (Before/After).
8. **Migrations Only:** Manual DB schema changes are strictly prohibited. All schema changes must pass through an Alembic migration.

### Frontend (State & UX)
9. **State Management:** Never mutate React state directly. Avoid prop drilling deep trees; use Context API (e.g., `AuthContext`, `CartContext`) for global data.
10. **JWT Expiry Handling:** Token expiry must be handled automatically in the Axios interceptor (e.g., transparent refresh or seamless redirect to login preserving the `returnUrl`).
11. **Loading & Error States:** Every API call must visually handle 3 states: Loading, Success, Failure. Crashing the UI or showing blank screens during network requests is unacceptable.
12. **Secure Token Storage:** Avoid storing highly sensitive tokens (Admin JWT) in `localStorage` where they are vulnerable to XSS. Prefer `httpOnly` cookies where possible.

### DevOps & Workflow
13. **Environment Segregation:** Development, Staging, and Production MUST use completely separated databases and API keys.
14. **Secret Management:** Never commit secrets to Git. `.env` must remain in `.gitignore`. Use a secrets manager or server environment variables.
15. **Backup Resilience:** Backups are useless if they cannot be restored. Scheduled backups must exist, and restoration must be verified periodically on a staging environment.

## General Development Philosophy
- **Root Changes over Patches (No Band-Aids):** When the user requests a specific change, do not apply a superficial patch or workaround ("תלאי"). Instead, trace the issue to its source and implement the change from the root (e.g., updating the core component, centralizing the logic, or modifying the root infrastructure).

## Console Error Diagnoser Skill & The "New Order Lifecycle" Pre-Check
**PRE-CHECK:** Before diagnosing ANY bug, console error, or 500 error, you MUST actively cross-reference the error with the comprehensive historical changes we made to the ordering process. Ask yourself: "Is this bug a side-effect of the new Cart/Order separation logic or missing schemas?"

**Historical Context of System Changes (Always keep these in mind):**
1. **Phase 1: Database & Admin Panel:**
   - Default `Order` status changed to `order_unpaid` (in `models.py`).
   - Mapped new statuses and icons in Admin Panel (`RegionCard.jsx`): `cart` 🛒, `order_unpaid` 📦, `order_paid` 💲📦, `cutting_unpaid` ✂️, `cutting_paid` ✂️💲, `archived`.
   - Hidden "Order #" text from active carts (since they have negative IDs).
   - Optimized `get_customer_orders` to return a single virtual cart, treating it as history 1 for new customers.

2. **Phase 2: Checkout Logic (Toggle Button):**
   - Created `POST /orders/{order_id}/revert_to_cart` to release stock and move order back to cart.
   - The top "Send Order" (שלח הזמנה) button acts as a Toggle: Clicking it converts the cart to an order (`order_unpaid`) and deducts stock. Clicking again reverts to cart and restores stock.

3. **Phase 3: Secure Payment & Season Closure:**
   - Added a "Secure Payment" (לתשלום מאובטח) button at the bottom of the cart (currently Disabled).
   - After the deadline passes: orders lock, statuses change to `cutting_unpaid` / `cutting_paid`, and only payments are allowed (no item modifications).
   - "Close Season" (סגירת עונה) in the admin panel moves all orders to `archived`, and the next order for the customer becomes +1 in their history.

4. **Common Pitfalls from these Changes:**
   - **Schema Mismatches:** `CartItemOut` returns `color_sku.product_model`, but `OrderItemOut` only returns `color_sku`. Frontend components rendering active orders might crash if they expect `product_model`.
   - **Missing User Regions:** `user.region_id` can be `None`. Accessing `user.region.shipping_cost` during checkout will throw a 500 error if not validated first.

**When a console error is provided, analyze and report it using this strict structure:**
1. **Severity (חומרת הבעיה):** Classify as "Critical" (causes app crash, blank screen, or data corruption) or "Non-Critical" (app continues running, e.g., minor network block, console warning).
2. **Root Cause (שורש הבעיה):** Explain the core technical issue in one clear sentence, explicitly referencing the historical checkpoints above if applicable.
3. **Actionable Fix (פתרון מעשי):** Provide the exact technical steps or explicitly state if it can be safely ignored and why.

## Dead Code & Ghost Logic Detector (Post-Refactor Rule)
Since the system underwent a major architectural shift (moving to the Toggle Cart/Order logic), there is a high risk of "Ghost Logic" - old functions, API calls, or state variables that are no longer used but still exist in the codebase.
**Rule:**
Whenever you edit or read a component or hook (especially in the Cart/Checkout flow), actively scan for DEAD CODE. 
If you find a function or state that you suspect is unnecessary or you don't understand its purpose under the NEW logic, DO NOT IGNORE IT. You MUST explicitly point it out to the user and ask for permission to delete it to keep the codebase clean.

## Explicit Permission for Code Changes
**Rule:**
Always ask for permission before fixing or writing code, unless I explicitly tell you to write it. Report findings first, propose a fix, and wait for my approval before making any code modifications.

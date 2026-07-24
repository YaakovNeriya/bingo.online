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

### Backend (Rules 1-8)
1. **Zero Trust:** Server-side Pydantic validation & permission checks (`Depends(get_current_active_superuser)`).
2. **Atomic Transactions:** Multi-step ops (checkout/stock) must use `async with db.begin()`.
3. **Error Handling:** Sanitize DB exceptions into clean `HTTPException`s.
4. **TDD:** Unit tests for money, inventory, and order lifecycle edge cases.
5. **Decimals Only:** Use `Numeric(10,2)` in DB and `Decimal` in Python (never `float`).
6. **Rate Limiting:** Protect form/heavy endpoints with rate limiting (`slowapi`).
7. **Audit Logs:** Log critical state changes in `AuditLog` (Who/When/What).
8. **Migrations:** Schema changes must pass through Alembic migrations.

### Frontend (Rules 9-13)
9. **Immutable State:** No direct React state mutation; use Context API for global state.
10. **JWT Interceptor:** Handle token expiry/refresh transparently in Axios interceptor.
11. **Loading & Error UI:** Every API call must visually handle Loading, Success, and Error states.
12. **Token Security:** Store sensitive tokens in `httpOnly` cookies where possible (avoid `localStorage`).
13. **Performance:** Use CSS classes for dynamic/repeated styling instead of inline `style={{...}}` in `.map()` loops.

### DevOps (Rules 14-15)
14. **Environment Isolation:** Dev, Staging, and Prod must use separate DBs and API keys.
15. **Secret & Backup Resilience:** Never commit `.env`/secrets to Git; maintain and test automated DB backups.

## Schemas & Common Pitfalls (Cart vs. Order)
- **Schema Mismatches:** `CartItemOut` returns `color_sku.product_model`, but `OrderItemOut` only returns `color_sku`. Frontend components rendering active orders must handle missing `product_model` gracefully.
- **Optional User Region:** `user.region_id` can be `None`. Always validate before accessing `user.region.shipping_cost` during checkout to prevent 500 errors.

## General Development Philosophy
- **Root Changes over Patches (No Band-Aids & Performance Purity):** When the user requests a specific change, do not apply a superficial patch or workaround ("תלאי"). Trace the issue to its source and implement the change from the root. Furthermore, **never sacrifice performance or proper architectural patterns for a "quick fix"** (e.g., bypassing Nginx and proxying static files to the backend just to avoid fixing a Docker permissions issue). Always resolve the root infrastructure issue so the system runs optimally as intended in production.

## Console Error Diagnoser Skill & The "New Order Lifecycle" Pre-Check
**PRE-CHECK:** Before diagnosing ANY bug, console error, or 500 error, you MUST actively cross-reference the error with the ordering process logic and schemas (see `ignore/Fabric Store.md` for historical Phase 1-3 details). Ask yourself: "Is this bug a side-effect of the Cart/Order separation logic or missing schemas?"

**When a console error is provided, analyze and report it using this strict structure:**
1. **Severity (חומרת הבעיה):** Classify as "Critical" (causes app crash, blank screen, or data corruption) or "Non-Critical" (app continues running, e.g., minor network block, console warning).
2. **Root Cause (שורש הבעיה):** Explain the core technical issue in one clear sentence.
3. **Actionable Fix (פתרון מעשי):** Provide the exact technical steps or explicitly state if it can be safely ignored and why.


## Explicit Permission for Code Changes
**Rule:**
Always ask for permission before fixing or writing code, unless I explicitly tell you to write it. Report findings first, propose a fix, and wait for my approval before making any code modifications.

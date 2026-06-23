# Fabric Store - Implementation Plan

## 1. Architecture & Technology Stack
- **Backend**: FastAPI (Python) - Domain-Driven N-Tier Architecture.
- **Database**: MySQL (Asynchronous access via `aiomysql` or `asyncmy`, migrations managed by Alembic).
- **Cache**: Redis (For dramatic performance improvements in catalog retrieval).
- **Frontend**: React.js (Mobile-First) - Feature-Based Architecture.
- **Infrastructure**: Docker and Docker Compose (For local development and deployment).

### Backend Architectural Principles (Domain-Driven N-Tier)
- **Validation Layer (Schemas/DTOs)**: Strict validation of incoming JSON payloads (using Pydantic) before reaching the logic layer.
- **Presentation/Routes Layer**: Handles HTTP requests, triggers schema validation, and returns HTTP responses. Strictly NO business logic or direct DB calls in this layer.
- **Business Logic (Services) Layer**: The "Brain". Handles calculations (e.g., measurements, inventory management) and external calls. Completely decoupled from HTTP concepts.
- **Data Access Layer (DAL/Models)**: Exclusively handles ORM models and database queries. No other layer accesses the DB directly. Enforces Database Locks (Pessimistic Locking / `SELECT FOR UPDATE`) during inventory manipulations to prevent Race Conditions.
- **App Factory**: Utilizes `create_app()` for robust environment management (Production, Testing).
- **Core System**: Centralizes configuration, security, global exception handling, and middlewares under the `core` directory.
- **Data Types (Strictness)**: Absolute enforcement of `Decimal` types in both Python and MySQL (prohibiting `Float`) for all pricing and measurement (meters) fields to prevent floating-point calculation errors.

### Performance & Optimization
- Fully asynchronous database operations (Async SQLAlchemy).
- Prevention of N+1 query problems using Eager Loading (`selectinload`, `joinedload`).
- Utilization of Redis to cache the public catalog, significantly reducing heavy MySQL queries.

### Frontend Architectural Principles (React MVC View)
- **Separation of Concerns (SoC)**: React acts purely as the "View", communicating with the backend exclusively via REST API (JSON).
- **Feature-Based Structure**: Code organization (Components, Hooks, Context) by features (e.g., auth, catalog) under `src/features/`.
- **Centralized API**: All server communications are centralized within the `src/api/` directory.

### Image Management
- **Approach**: Hybrid Storage with Dependency Injection.
- **Development (Dev)**: Local storage (`uploads/` directory + Docker volume).
- **Production (Prod)**: Cloud storage (AWS S3, via `boto3`).
- **Database**: Stores only the image URL (String).
- **Code Architecture**: Abstract `StorageService` class with concrete implementations (`LocalStorage`, `S3Storage`) and a `Depends()` function to inject the appropriate implementation based on the environment.

## 2. Business Logic & UX

### Product Hierarchy & Attributes
- **Level 1**: Fabric Type
- **Level 2**: Model
- **Level 3**: Color (SKU - The actual sellable item)
- **Flexible Pricing**: Admin toggle to set either a uniform price per Model or specific prices per Color/SKU.
- **Sets**: Fabrics can be grouped into Sets. Customers can individually select and purchase specific fabrics from a set.

### Measurements, Purchasing Rules & Security
- **Minimum Order**: 1 meter per fabric.
- **Increments**: 0.1 meter jumps (e.g., 1.1m, 1.2m).
- **Inventory**: Stock deduction occurs only at final order placement (Checkout) under a locked DB transaction to prevent concurrent purchase of the same final meter.
- **Backend Trust (Price Security)**: Strict prohibition on accepting "Total to Pay" from the frontend. The server MUST recalculate the entire order sum against the current database prices during checkout.

### Users, Cart & Communications
- **Registration (Mandatory)**: Requires Email, Password, Phone number, and selection of a predefined Service Region.
- **Service Regions**: Determine shipping costs and delivery days.
- **Cart**: Stored in the DB and linked to the `user_id` for cross-device persistence.

## 3. Admin Panel
- **Catalog CRUD**: Add, edit, and Soft Delete. Out-of-stock or discontinued products are not physically deleted; they are hidden (`is_active=False`) to prevent breaking historical order data.
- **Inventory Management**: Tracks remaining meters and triggers "Low Stock" alerts.
- **Cart Management**: Dashboard for abandoned carts with actions to delete individual carts or a "Clear All" bulk action for old abandoned carts.
- **Orders**: View details, edit (e.g., update shipping address), change status ("Received" -> "Shipped" -> "Completed"), and export capabilities (PDF/Sheets).
- **Reports/Dashboard**: Best-selling products and sales statistics.

## 4. Database Schema (High-Level)
- **Regions**: ID, Region Name, Shipping Cost, Delivery Days.
- **Users**: ID, Email, Password Hash, Phone, Region ID.
- **ProductTypes, Models, Colors/SKUs**: Product hierarchy, fixed widths, inventory in meters (Must be `DECIMAL`), soft delete flag (`is_active`), and image URL.
- **Carts, CartItems**: Cart management (Quantity in meters must be `DECIMAL`).
- **Orders, OrderItems**: Historical orders, statuses, and locked prices at the time of purchase.

## 5. Infrastructure & Environment

### Docker Compose Services
The AI agent must generate a `docker-compose.yml` including:
- **db**: MySQL container based on the official image (with a Volume for data persistence).
- **redis**: Official Redis container for the caching system.
- **backend**: FastAPI container. Run command (dev): `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`. (Includes a Volume for the `uploads/` directory).
- **frontend**: Node.js container for React/Vite. Run command (dev): `npm run dev -- --host 0.0.0.0`.

### Mandatory Environment Variables (`.env`)
A `.env.example` template must be generated containing:
- **Database**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- **Cache**: `REDIS_URL` (e.g., `redis://redis:6379/0`).
- **Security**: `SECRET_KEY` (for JWT), `ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Storage**: `STORAGE_ENV` (dev/prod). If prod, requires: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`.
- **Mail/SMTP**: SMTP server credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).

## 6. Required Architectural Structure

```text
my_project/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini          # Alembic configuration
│   ├── alembic/             # Database migrations folder
│   ├── app/
│   │   ├── __init__.py          # App Factory - create_app()
│   │   ├── core/                # config.py, security.py, exceptions.py
│   │   ├── db/                  # database.py (Async), base_class.py
│   │   ├── domains/             # Feature-based modules
│   │   │   ├── users/
│   │   │   │   ├── routes.py    # Presentation (No Logic/DB)
│   │   │   │   ├── services.py  # Business Logic
│   │   │   │   ├── models.py    # DAL / ORM
│   │   │   │   └── schemas.py   # DTOs / Validation
│   │   │   ├── products/        # Catalog, Inventory
│   │   │   ├── orders/          # Cart & Checkout
│   │   │   └── admin/           # Dashboard & Management
│   │   └── utils/               # Shared helpers (storage_service.py, cache.py, email_service.py)
│   └── tests/
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── src/
        ├── api/                 # Axios/Fetch configs and endpoints
        ├── components/          # Global UI (Buttons, Inputs)
        ├── features/            # Feature-based structure
        │   ├── auth/
        │   │   ├── components/
        │   │   └── hooks/
        │   ├── catalog/         # Products display, filters
        │   ├── cart/            # Cart management
        │   └── admin/           # Admin panel views
        ├── hooks/               # Global Custom Hooks
        ├── layouts/             # Page Layouts (Sidebar, Header)
        └── App.jsx
```

## 7. AI Agent Development Workflow

**STRICT INSTRUCTIONS FOR THE AI AGENT:**
- **Step-by-Step Execution**: You are strictly prohibited from generating the entire project at once. You MUST work exclusively according to the defined stages below.
- **Detailed Pre-Planning**: At the beginning of each stage, BEFORE writing any code, you must detail your exact execution plan for that specific stage (which files will be created, the underlying logic, and any added dependencies).
- **Self-Verification & Integration**: Upon finishing the code for a stage, you MUST verify your own work. Ensure the code is bug-free, strictly adheres to the architectural rules (DDD, Decimal types, DB locks, Backend Trust), and seamlessly integrates with code from previous stages without breaking them.
- **Pause for Approval**: Do NOT proceed to the next stage without explicit confirmation from the user that the current stage has been tested, runs successfully, and is approved.

### Development Stages:
- **Stage 1: Infrastructure**: Create `docker-compose.yml`, Dockerfiles (backend and frontend), the complete folder tree, and the `.env.example` file.
- **Stage 2: Backend Core**: Configure `create_app()` in FastAPI, establish the asynchronous database connection (`db/database.py`), and initialize the Alembic environment (`alembic init`).
- **Stage 3: Data Access Layer (DAL)**: Write all SQLAlchemy models across the various domains, and generate the initial Alembic migration.
- **Stage 4: Users Domain**: Fully implement registration and authentication (Schemas, Services, Routes, including JWT).
- **Stage 5: Products Domain**: Implement the catalog retrieval API, including Redis caching integration.
- **Stage 6: Cart & Orders Domain**: Implement the business logic (fractional meter increments, price security checks) and inventory deduction safeguarded by DB locks (`SELECT FOR UPDATE`). Add the email notification service.
- **Stage 7: Admin Panel**: Implement backend API routes for administrators (CRUD, reports, abandoned cart cleanup).
- **Stage 8: Frontend Client**: Bootstrap the React infrastructure, configure `src/api` for server communication, and build the UI features (catalog, cart, checkout, admin) according to the feature-based structure.


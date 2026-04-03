# Architecture Overview

## Tech Stack

### Frontend

* **Framework:** Vite + React (TypeScript)
* **UI Components:** shadcn/ui
* **Styling:** Tailwind CSS
* **State Management:** Zustand (preferred for scalability)
* **Routing:** React Router
* **API Client:** Axios / React Query (standardized wrapper)

---

### Backend

* **Framework:** FastAPI (Python)
* **API Type:** REST
* **Validation:** Pydantic
* **Authentication:** JWT (Access + Refresh tokens)
* **Architecture Pattern:** Clean Architecture (Router → Service → Repository)

---

### Database

* **Database:** PostgreSQL
* **ORM:** SQLAlchemy (with async support)
* **Migrations:** Alembic

---

### Infrastructure

* **Containerization:** Docker
* **Environment Management:** `.env` files
* **Deployment (optional):** Azure / AWS / Render
* **Reverse Proxy (optional):** Nginx

---

## Project Structure

### Frontend (Vite + React)

```
frontend/
│── src/
│   ├── components/        # Reusable UI components (shadcn based)
│   ├── pages/            # Route-level pages
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API calls
│   ├── store/            # Global state (Zustand/Context)
│   ├── lib/              # Utilities/helpers
│   ├── layouts/          # Layout components
│   └── main.tsx          # Entry point
│
└── index.html
```

---

### Backend (FastAPI)

```
backend/
│── app/
│   ├── api/              # Routes/controllers
│   ├── schemas/          # Pydantic models
│   ├── models/           # SQLAlchemy models
│   ├── services/         # Business logic
│   ├── repositories/     # DB interactions
│   ├── core/             # Config, security, utils
│   ├── db/               # DB session & setup
│── alembic/              # Migrations
└── main.py               # Entry point
```

---

## Architecture Principles

### 1. Separation of Concerns

* API layer → Handles HTTP requests
* Service layer → Business logic
* Repository layer → Database access

---

### 2. Clean API Design

* Use RESTful endpoints
* Consistent response format
* Proper status codes

---

### 3. Type Safety

* Frontend: TypeScript everywhere
* Backend: Pydantic schemas for validation

---

### 4. Reusability

* Shared UI components via shadcn
* Reusable services/hooks

---

### 5. Scalability

* Modular folder structure
* Stateless backend
* Async operations in FastAPI

---

## Authentication Flow

1. User logs in via frontend
2. Backend validates credentials
3. Backend returns:

   * Access Token (short-lived)
   * Refresh Token (long-lived)
4. Frontend stores tokens securely
5. Protected routes require JWT in headers

---

## API Communication

* Base URL configured via environment
* All API calls go through a centralized service layer
* Error handling standardized

---

## Coding Guidelines

### Frontend

* Use functional components
* Prefer hooks over class components
* Use shadcn components for UI consistency
* Avoid inline styles

### Backend

* Use async/await
* Keep routes thin (no business logic)
* Use dependency injection where possible
* Validate all inputs with Pydantic

---

## Environment Variables

### Backend

```
DATABASE_URL=
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=
```

### Frontend

```
VITE_API_BASE_URL=
```

---

## Development Workflow

1. Define API contract
2. Implement backend endpoint
3. Integrate frontend service
4. Build UI using shadcn components
5. Test end-to-end

---

## Future Enhancements

* Role-based access control (RBAC)
* Caching (Redis)
* Background jobs (Celery / RQ)
* WebSockets for real-time updates
* CI/CD pipelines

---

## Notes for AI Tools (Copilot Guidance)

* Always follow the defined folder structure
* Do not mix business logic in API routes
* Use service + repository pattern
* Use TypeScript types and Pydantic schemas consistently
* Prefer existing utilities over creating new ones
* Maintain consistency with existing code patterns

---

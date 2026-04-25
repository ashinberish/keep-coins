# KeepCoins

A personal finance tracker to manage expenses, income, EMIs, accounts, and group expenses — all in one place.

## Tech Stack

| Layer      | Technology                                                   |
| ---------- | ------------------------------------------------------------ |
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand |
| Backend    | FastAPI, Python, Pydantic, SQLAlchemy (async)                |
| Database   | PostgreSQL + asyncpg                                         |
| Auth       | JWT (access + refresh tokens), email verification            |
| Email      | Resend                                                       |
| Migrations | Alembic                                                      |

## Project Structure

```
keepcoins/
├── frontend/          # React SPA
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Route-level pages
│       ├── hooks/         # Custom React hooks
│       ├── services/      # API client layer
│       ├── store/         # Zustand state management
│       └── lib/           # Utilities
├── backend/           # FastAPI REST API
│   └── app/
│       ├── api/           # Route handlers
│       ├── schemas/       # Pydantic request/response models
│       ├── models/        # SQLAlchemy ORM models
│       ├── services/      # Business logic
│       ├── repositories/  # Database queries
│       └── core/          # Config, security, email, rate limiting
└── templates/             # Email templates
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/keepcoins
SECRET_KEY=your-secret-key
MODE=development
RESEND_API_KEY=your-resend-key
ALERT_EMAIL=your@email.com
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs` when `MODE=development`.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Runs at `http://localhost:5173` by default.

## Contributing

Contributions are welcome! Here's how to get involved.

### How to Contribute

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/keepcoins.git
   ```
3. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/your-feature
   ```
4. **Make your changes** — follow the conventions below
5. **Test** your changes locally (both frontend build and backend)
6. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add budget tracking page"
   ```
7. **Push** and open a **Pull Request** against `main`

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix      | Usage                                |
| ----------- | ------------------------------------ |
| `feat:`     | New feature                          |
| `fix:`      | Bug fix                              |
| `docs:`     | Documentation only                   |
| `style:`    | Formatting, no logic change          |
| `refactor:` | Code restructure, no behavior change |
| `test:`     | Adding or updating tests             |
| `chore:`    | Build, config, dependency updates    |

### Code Guidelines

- **Backend**: Follow the Router → Service → Repository pattern. Add Pydantic schemas for all request/response bodies. All database access goes through repositories.
- **Frontend**: Use shadcn/ui components. State management via Zustand stores. API calls go in `services/`. Use TypeScript strictly — no `any`.
- **Naming**: snake_case for Python, camelCase for TypeScript.
- **Security**: All API endpoints must use the `get_current_user` dependency. Services must verify resource ownership.

### Reporting Issues

Open an issue with:

- A clear title and description
- Steps to reproduce (if it's a bug)
- Expected vs actual behavior
- Screenshots if applicable

### Feature Requests

Open an issue tagged with `enhancement` describing:

- The problem it solves
- Proposed solution or UI mockup
- Any alternatives considered

## License

This project is open source under the [MIT License](LICENSE).

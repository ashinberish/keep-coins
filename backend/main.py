from app.api.accounts import router as accounts_router
from app.api.app_config import router as config_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.emis import router as emis_router
from app.api.expenses import router as expenses_router
from app.api.groups import router as groups_router
from app.api.summary import router as summary_router
from app.core.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

is_dev = settings.MODE == "development"

app = FastAPI(
    title="KeepCoins API",
    version="0.1.0",
    docs_url="/docs" if is_dev else None,
    redoc_url="/redoc" if is_dev else None,
    openapi_url="/openapi.json" if is_dev else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(emis_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(accounts_router, prefix="/api")
app.include_router(config_router, prefix="/api")
app.include_router(groups_router, prefix="/api")
app.include_router(summary_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

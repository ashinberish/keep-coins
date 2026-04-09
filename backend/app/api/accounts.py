from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=list[AccountResponse])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AccountService(db)
    return await service.list_for_user(current_user.id)


@router.post("", response_model=AccountResponse, status_code=201)
async def create_account(
    data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AccountService(db)
    return await service.create(data, current_user.id)


@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = AccountService(db)
    await service.delete(UUID(account_id), current_user.id)


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = AccountService(db)
    return await service.update(UUID(account_id), data, current_user.id)

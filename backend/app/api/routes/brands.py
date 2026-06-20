import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Brand, BrandCreate, BrandPublic, BrandsPublic, BrandUpdate, Message

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("/", response_model=BrandsPublic)
def read_brands(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    count_statement = (
        select(func.count())
        .select_from(Brand)
        .where(Brand.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Brand)
        .where(Brand.owner_id == current_user.id)
        .order_by(Brand.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    brands = session.exec(statement).all()
    return BrandsPublic(data=brands, count=count)


@router.get("/{id}", response_model=BrandPublic)
def read_brand(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    brand = session.get(Brand, id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return brand


@router.post("/", response_model=BrandPublic)
def create_brand(
    *, session: SessionDep, current_user: CurrentUser, brand_in: BrandCreate
) -> Any:
    brand = Brand.model_validate(brand_in, update={"owner_id": current_user.id})
    session.add(brand)
    session.commit()
    session.refresh(brand)
    return brand


@router.put("/{id}", response_model=BrandPublic)
def update_brand(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    brand_in: BrandUpdate,
) -> Any:
    brand = session.get(Brand, id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = brand_in.model_dump(exclude_unset=True)
    brand.sqlmodel_update(update_dict)
    session.add(brand)
    session.commit()
    session.refresh(brand)
    return brand


@router.delete("/{id}")
def delete_brand(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    brand = session.get(Brand, id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(brand)
    session.commit()
    return Message(message="Brand deleted successfully")

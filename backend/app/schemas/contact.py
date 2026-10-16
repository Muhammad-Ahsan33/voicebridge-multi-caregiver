from pydantic import Field

from app.schemas.common import CamelModel


class ContactBase(CamelModel):
    name: str
    relationship: str = ""
    avatar_color: str = "#2D6E8E"
    initials: str = ""
    phone: str


class ContactCreate(ContactBase):
    pass


class ContactUpdate(CamelModel):
    name: str | None = None
    relationship: str | None = None
    avatar_color: str | None = None
    initials: str | None = None
    phone: str | None = None


class ContactOut(ContactBase):
    id: str

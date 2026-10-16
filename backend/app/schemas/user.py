from app.schemas.common import CamelModel


class UserOut(CamelModel):
    id: str
    name: str
    email: str
    role: str

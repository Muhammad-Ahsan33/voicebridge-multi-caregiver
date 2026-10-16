from app.schemas.common import CamelModel


class MessageBase(CamelModel):
    title: str
    category_id: str  # people | needs | questions | actions | emergency
    thumb_color: str = "#2D6E8E"
    initials: str = ""


class MessageCreate(MessageBase):
    pass


class MessageUpdate(CamelModel):
    title: str | None = None
    category_id: str | None = None
    thumb_color: str | None = None
    initials: str | None = None


class MessageOut(MessageBase):
    id: str
    # These are populated with fresh SIGNED URLs at read time by the
    # router — never read directly off the ORM object's raw column value.
    video_url: str | None = None
    audio_url: str | None = None

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base schema: Python/DB use snake_case, JSON wire format uses camelCase
    to match frontend/src/types.ts exactly (see Phase 2 spec, Section 5)."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

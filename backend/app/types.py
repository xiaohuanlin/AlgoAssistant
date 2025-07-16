from sqlalchemy.types import TypeDecorator
from sqlalchemy.dialects.postgresql import JSON
from pydantic import BaseModel
from typing import Type

class PydanticJSON(TypeDecorator):
    """SQLAlchemy type decorator for automatically converting Pydantic models to/from JSON.
    This type decorator handles the conversion between Pydantic models and JSON fields in the database.
    """
    impl = JSON

    def __init__(self, model: Type[BaseModel], *args, **kwargs):
        self.model = model
        super().__init__(*args, **kwargs)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        elif isinstance(value, BaseModel):
            return value.model_dump()
        elif isinstance(value, dict):
            return value
        else:
            raise ValueError(f"Invalid type for PydanticJSON: {type(value)}. Expected BaseModel, dict, or None.")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        elif isinstance(value, dict):
            return self.model.model_validate(value)
        elif isinstance(value, str):
            return self.model.model_validate_json(value)
        else:
            raise ValueError(f"Invalid type for PydanticJSON result: {type(value)}. Expected dict or str.") 
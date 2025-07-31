"""Comprehensive tests for BaseDBService."""

from unittest.mock import MagicMock, Mock

import pytest
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.base_db_service import BaseDBService


class MockModel:
    """Mock SQLAlchemy model for testing."""

    def __init__(self, id=None, name=None):
        self.id = id
        self.name = name


class MockCreateSchema(BaseModel):
    """Mock create schema for testing."""

    name: str


class MockUpdateSchema(BaseModel):
    """Mock update schema for testing."""

    name: str


class TestBaseDBService:
    """Test cases for BaseDBService CRUD operations."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_db = Mock(spec=Session)
        self.service = BaseDBService(self.mock_db, MockModel)

    def test_get_existing_record(self):
        """Test getting an existing record by ID."""
        # Arrange
        expected_record = MockModel(id=1, name="test")
        self.mock_db.query.return_value.filter.return_value.first.return_value = (
            expected_record
        )

        # Act
        result = self.service.get(1)

        # Assert
        assert result == expected_record
        self.mock_db.query.assert_called_once_with(MockModel)

    def test_get_nonexistent_record(self):
        """Test getting a nonexistent record returns None."""
        # Arrange
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act
        result = self.service.get(999)

        # Assert
        assert result is None

    def test_get_multi_with_pagination(self):
        """Test getting multiple records with pagination."""
        # Arrange
        expected_records = [
            MockModel(id=1, name="test1"),
            MockModel(id=2, name="test2"),
        ]
        self.mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = (
            expected_records
        )

        # Act
        result = self.service.get_multi(skip=10, limit=5)

        # Assert
        assert result == expected_records
        self.mock_db.query.return_value.offset.assert_called_once_with(10)
        self.mock_db.query.return_value.offset.return_value.limit.assert_called_once_with(
            5
        )

    def test_get_multi_default_pagination(self):
        """Test getting multiple records with default pagination."""
        # Arrange
        expected_records = [MockModel(id=1, name="test")]
        self.mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = (
            expected_records
        )

        # Act
        result = self.service.get_multi()

        # Assert
        assert result == expected_records
        self.mock_db.query.return_value.offset.assert_called_once_with(0)
        self.mock_db.query.return_value.offset.return_value.limit.assert_called_once_with(
            100
        )

    def test_create_record(self):
        """Test creating a new record."""
        # Arrange
        create_data = MockCreateSchema(name="new_record")
        expected_record = MockModel(id=1, name="new_record")

        # Mock the model constructor and database operations
        self.service.model = Mock(return_value=expected_record)

        # Act
        result = self.service.create(create_data)

        # Assert
        assert result == expected_record
        self.service.model.assert_called_once_with(name="new_record")
        self.mock_db.add.assert_called_once_with(expected_record)
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(expected_record)

    def test_update_record(self):
        """Test updating an existing record."""
        # Arrange
        existing_record = MockModel(id=1, name="old_name")
        update_data = MockUpdateSchema(name="new_name")

        # Act
        result = self.service.update(existing_record, update_data)

        # Assert
        assert result == existing_record
        assert existing_record.name == "new_name"
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(existing_record)

    def test_update_record_exclude_unset(self):
        """Test updating record only sets provided fields."""
        # Arrange
        existing_record = MockModel(id=1, name="old_name")
        existing_record.other_field = "should_not_change"

        # Mock the dict method to simulate exclude_unset behavior
        update_data = Mock()
        update_data.dict.return_value = {"name": "new_name"}

        # Act
        result = self.service.update(existing_record, update_data)

        # Assert
        assert result == existing_record
        assert existing_record.name == "new_name"
        assert existing_record.other_field == "should_not_change"

    def test_delete_existing_record(self):
        """Test deleting an existing record."""
        # Arrange
        existing_record = MockModel(id=1, name="to_delete")
        self.service.get = Mock(return_value=existing_record)

        # Act
        result = self.service.delete(1)

        # Assert
        assert result is True
        self.service.get.assert_called_once_with(1)
        self.mock_db.delete.assert_called_once_with(existing_record)
        self.mock_db.commit.assert_called_once()

    def test_delete_nonexistent_record(self):
        """Test deleting a nonexistent record returns False."""
        # Arrange
        self.service.get = Mock(return_value=None)

        # Act
        result = self.service.delete(999)

        # Assert
        assert result is False
        self.service.get.assert_called_once_with(999)
        self.mock_db.delete.assert_not_called()
        self.mock_db.commit.assert_not_called()

    def test_get_by_field(self):
        """Test getting a record by a specific field."""
        # Arrange
        expected_record = MockModel(id=1, name="test_name")
        self.mock_db.query.return_value.filter.return_value.first.return_value = (
            expected_record
        )

        # Act
        result = self.service.get_by_field("name", "test_name")

        # Assert
        assert result == expected_record
        self.mock_db.query.assert_called_with(MockModel)

    def test_get_multi_by_field(self):
        """Test getting multiple records by a specific field."""
        # Arrange
        expected_records = [
            MockModel(id=1, name="test_name"),
            MockModel(id=2, name="test_name"),
        ]
        (
            self.mock_db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value
        ) = expected_records

        # Act
        result = self.service.get_multi_by_field("name", "test_name", skip=5, limit=10)

        # Assert
        assert result == expected_records
        self.mock_db.query.assert_called_with(MockModel)
        self.mock_db.query.return_value.filter.return_value.offset.assert_called_once_with(
            5
        )

    def test_get_multi_by_field_default_pagination(self):
        """Test getting multiple records by field with default pagination."""
        # Arrange
        expected_records = [MockModel(id=1, name="test_name")]
        (
            self.mock_db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value
        ) = expected_records

        # Act
        result = self.service.get_multi_by_field("name", "test_name")

        # Assert
        assert result == expected_records
        self.mock_db.query.return_value.filter.return_value.offset.assert_called_once_with(
            0
        )
        self.mock_db.query.return_value.filter.return_value.offset.return_value.limit.assert_called_once_with(
            100
        )

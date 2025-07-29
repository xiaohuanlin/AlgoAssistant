"""
Test suite for account settings API endpoints.
Tests password change and avatar upload functionality.
"""

from io import BytesIO
from pathlib import Path

import pytest
import requests
from PIL import Image


class TestAccountSettings:
    """Test class for account settings endpoints."""

    @pytest.fixture(autouse=True)
    def setup(self, base_url, test_user):
        """Setup test data and authentication."""
        self.base_url = base_url
        self.test_user = test_user
        self.token = None

        # Ensure test user exists and get auth token
        self._ensure_test_user()
        self._login()

    def _ensure_test_user(self):
        """Ensure test user exists in the system."""
        response = requests.post(
            f"{self.base_url}/api/users/register", json=self.test_user
        )
        # Accept both 200 (created) and 400 (already exists)
        assert response.status_code in [200, 400]

    def _login(self):
        """Login and get authentication token."""
        response = requests.post(
            f"{self.base_url}/api/users/login",
            json={
                "username": self.test_user["username"],
                "password": self.test_user["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        self.token = data.get("access_token")
        assert self.token is not None

    def _create_test_image(self):
        """Create a simple test image for avatar upload."""
        img = Image.new("RGB", (100, 100), color="red")
        img_byte_arr = BytesIO()
        img.save(img_byte_arr, format="PNG")
        img_byte_arr.seek(0)
        return img_byte_arr

    def test_password_change_with_wrong_current_password(self):
        """Test password change with incorrect current password."""
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {"current_password": "wrongpassword", "new_password": "newpass123"}

        response = requests.post(
            f"{self.base_url}/api/users/change-password", json=data, headers=headers
        )

        assert response.status_code == 400
        assert "incorrect" in response.text.lower()

    def test_password_change_with_correct_current_password(self):
        """Test password change with correct current password."""
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {
            "current_password": self.test_user["password"],
            "new_password": "newpass123",
        }

        response = requests.post(
            f"{self.base_url}/api/users/change-password", json=data, headers=headers
        )

        assert response.status_code == 200
        response_data = response.json()
        assert "message" in response_data
        assert "updated_at" in response_data

        # Update password for subsequent tests
        self.test_user["password"] = "newpass123"

    def test_avatar_upload_success(self):
        """Test successful avatar upload."""
        headers = {"Authorization": f"Bearer {self.token}"}
        test_image = self._create_test_image()
        files = {"file": ("test_avatar.png", test_image, "image/png")}

        response = requests.post(
            f"{self.base_url}/api/users/upload-avatar", files=files, headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "url" in data
        assert "filename" in data
        assert data["url"].startswith("/uploads/avatars/")

    def test_avatar_upload_invalid_file_type(self):
        """Test avatar upload with invalid file type."""
        headers = {"Authorization": f"Bearer {self.token}"}
        # Create a text file instead of image
        text_file = BytesIO(b"This is not an image")
        files = {"file": ("test.txt", text_file, "text/plain")}

        response = requests.post(
            f"{self.base_url}/api/users/upload-avatar", files=files, headers=headers
        )

        assert response.status_code == 400
        assert "image" in response.text.lower()

    def test_profile_update(self):
        """Test profile update functionality."""
        headers = {"Authorization": f"Bearer {self.token}"}
        update_data = {"nickname": "Updated Test User", "email": "updated@example.com"}

        response = requests.put(
            f"{self.base_url}/api/users/user/profile", json=update_data, headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["nickname"] == "Updated Test User"
        assert data["email"] == "updated@example.com"

    def test_unauthorized_access(self):
        """Test that endpoints require authentication."""
        # Test without token
        response = requests.post(
            f"{self.base_url}/api/users/change-password",
            json={"current_password": "test", "new_password": "newtest"},
        )
        assert response.status_code == 401

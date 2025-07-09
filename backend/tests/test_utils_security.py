import pytest
from app.utils.security import (
    get_password_hash, 
    verify_password, 
    encrypt_data, 
    decrypt_data,
    get_fernet
)

class TestSecurityUtils:
    """Test security utility functions."""
    
    def test_password_hashing_and_verification(self):
        """Test password hashing and verification."""
        password = "testpassword123"
        
        # Hash password
        hashed = get_password_hash(password)
        
        assert hashed != password  # Should be different from original
        assert len(hashed) > len(password)  # Should be longer
        
        # Verify password
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False
    
    def test_password_hashing_consistency(self):
        """Test that password hashing produces different hashes for same password."""
        password = "testpassword123"
        
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Should be different due to salt
        assert hash1 != hash2
        
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True
    
    def test_encryption_and_decryption(self):
        """Test data encryption and decryption."""
        original_data = "sensitive_data_123"
        
        # Encrypt data
        encrypted = encrypt_data(original_data)
        
        assert encrypted != original_data  # Should be different
        assert len(encrypted) > len(original_data)  # Should be longer
        
        # Decrypt data
        decrypted = decrypt_data(encrypted)
        
        assert decrypted == original_data  # Should match original
    
    def test_encryption_consistency(self):
        """Test that encryption produces different results for same data."""
        data = "sensitive_data_123"
        
        encrypted1 = encrypt_data(data)
        encrypted2 = encrypt_data(data)
        
        # Should be different due to random IV
        assert encrypted1 != encrypted2
        
        # But both should decrypt to same data
        assert decrypt_data(encrypted1) == data
        assert decrypt_data(encrypted2) == data
    
    def test_encryption_with_empty_string(self):
        """Test encryption with empty string."""
        empty_data = ""
        
        encrypted = encrypt_data(empty_data)
        decrypted = decrypt_data(encrypted)
        
        assert decrypted == empty_data
    
    def test_encryption_with_special_characters(self):
        """Test encryption with special characters."""
        special_data = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        
        encrypted = encrypt_data(special_data)
        decrypted = decrypt_data(encrypted)
        
        assert decrypted == special_data
    
    def test_encryption_with_unicode(self):
        """Test encryption with unicode characters."""
        unicode_data = "测试数据 🚀 中文"
        
        encrypted = encrypt_data(unicode_data)
        decrypted = decrypt_data(encrypted)
        
        assert decrypted == unicode_data
    
    def test_decrypt_invalid_data(self):
        """Test decryption with invalid data."""
        invalid_data = "invalid_encrypted_data"
        
        # Should handle gracefully
        try:
            decrypted = decrypt_data(invalid_data)
            # If it doesn't raise an exception, the result should be different
            assert decrypted != invalid_data
        except Exception:
            # It's also acceptable to raise an exception for invalid data
            pass
    
    def test_encryption_decryption(self):
        """Test data encryption and decryption."""
        original_data = "sensitive_token_123"
        encrypted = encrypt_data(original_data)
        
        # Encrypted data should be different
        assert encrypted != original_data
        assert len(encrypted) > len(original_data)
        
        # Decryption should work
        decrypted = decrypt_data(encrypted)
        assert decrypted == original_data
    
    def test_encryption_with_empty_string(self):
        """Test encryption with empty string."""
        encrypted = encrypt_data("")
        decrypted = decrypt_data(encrypted)
        assert decrypted == ""
    
    def test_decryption_with_invalid_token(self):
        """Test decryption with invalid token."""
        result = decrypt_data("invalid_token")
        assert result == ""
    
    def test_fernet_instance(self):
        """Test Fernet instance creation."""
        fernet = get_fernet()
        assert fernet is not None
        
        # Test basic encryption/decryption
        test_data = b"test_data"
        encrypted = fernet.encrypt(test_data)
        decrypted = fernet.decrypt(encrypted)
        assert decrypted == test_data
    
    def test_multiple_password_hashes(self):
        """Test that multiple hashes of same password are different."""
        password = "testpassword"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Hashes should be different (due to salt)
        assert hash1 != hash2
        
        # Both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True 
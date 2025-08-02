import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

// Auth reducer for state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const token = authService.getToken();

      if (!token) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Validate token and get user info
      const user = authService.getCurrentUserFromStorage();

      if (!user) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Skip token validation during initialization to prevent immediate logout
      // Token will be validated on first API call if needed

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error.message || 'Authentication failed',
      });
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const response = await authService.login(credentials);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token || response.token,
        },
      });

      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error.message || 'Login failed',
      });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const response = await authService.register(userData);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token || response.token,
        },
      });

      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error.message || 'Registration failed',
      });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Update user profile
  const updateUser = useCallback(async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
      return updatedUser;
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error.message || 'Profile update failed',
      });
      throw error;
    }
  }, []);

  // Clear auth error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission) => {
      return state.user?.permissions?.includes(permission) || false;
    },
    [state.user],
  );

  // Listen for storage changes (for multi-tab logout)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value = {
    // State
    ...state,

    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasPermission,
    initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

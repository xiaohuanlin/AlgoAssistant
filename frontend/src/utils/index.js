import { STATUS_COLORS, UI_CONSTANTS, CACHE_CONFIG } from '../constants';

/**
 * Status utility functions
 */
export const getStatusColor = (status, type = 'execution') => {
  const colorMaps = STATUS_COLORS;
  return colorMaps[type.toUpperCase()]?.[status] || 'default';
};

export const getStatusText = (status) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Device detection utilities
 */
export const getDeviceType = () => {
  const width = window.innerWidth;
  const { MOBILE, TABLET } = UI_CONSTANTS.BREAKPOINTS;

  if (width <= MOBILE) return 'mobile';
  if (width <= TABLET) return 'tablet';
  return 'desktop';
};

export const isMobile = () => getDeviceType() === 'mobile';
export const isTablet = () => getDeviceType() === 'tablet';
export const isDesktop = () => getDeviceType() === 'desktop';

/**
 * Debounce utility
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle utility
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(null, args);
    }
  };
};

/**
 * Local storage utilities with error handling
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  },
};

/**
 * Cache utilities with expiration
 */
export const cache = {
  set: (key, data, expiry = CACHE_CONFIG.CONFIG_EXPIRY) => {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry,
    };
    return storage.set(key, cacheData);
  },

  get: (key) => {
    const cached = storage.get(key);
    if (!cached) return null;

    const { data, timestamp, expiry } = cached;
    const isExpired = Date.now() - timestamp > expiry;

    if (isExpired) {
      storage.remove(key);
      return null;
    }

    return data;
  },

  isValid: (key) => {
    const cached = storage.get(key);
    if (!cached) return false;

    const { timestamp, expiry } = cached;
    return Date.now() - timestamp <= expiry;
  },

  invalidate: (key) => {
    return storage.remove(key);
  },

  invalidatePattern: (pattern) => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  },
};

/**
 * URL utilities
 */
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

export const parseQueryParams = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

/**
 * Date utilities
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const formatOptions = { ...defaultOptions, ...options };

  try {
    return new Date(date).toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    return date;
  }
};

export const formatRelativeTime = (date) => {
  try {
    const now = Date.now();
    const timestamp = new Date(date).getTime();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return formatDate(date, { month: 'short', day: 'numeric' });
  } catch (error) {
    return date;
  }
};

/**
 * Convert UTC date to local time formatted string
 * @param {string|Date} utcDate - UTC date string or Date object
 * @param {string} format - Format string (default: 'YYYY-MM-DD HH:mm')
 * @returns {string} Formatted local time string
 */
export const formatLocalTime = (utcDate, format = 'YYYY-MM-DD HH:mm') => {
  if (!utcDate) return '-';

  try {
    let date;

    // Handle different input formats
    if (typeof utcDate === 'string') {
      // If the string doesn't end with 'Z' or timezone info, assume it's UTC
      if (
        !utcDate.includes('Z') &&
        !utcDate.includes('+') &&
        !utcDate.includes('T')
      ) {
        // Handle formats like "2024-01-01 12:00:00" as UTC
        date = new Date(utcDate + ' UTC');
      } else if (
        utcDate.includes('T') &&
        !utcDate.includes('Z') &&
        !utcDate.includes('+')
      ) {
        // Handle ISO format without timezone as UTC
        date = new Date(utcDate + 'Z');
      } else {
        // Standard parsing
        date = new Date(utcDate);
      }
    } else {
      date = new Date(utcDate);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return utcDate;
    }

    // Format based on the requested format using local time
    if (format === 'YYYY-MM-DD HH:mm') {
      // Use local time with 24-hour format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    if (format === 'YYYY-MM-DD') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (format === 'HH:mm') {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Default fallback - use user's local timezone
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return String(utcDate);
  }
};

/**
 * Number utilities
 */
export const formatNumber = (num, options = {}) => {
  const defaultOptions = {
    notation: 'standard',
    maximumFractionDigits: 2,
  };

  const formatOptions = { ...defaultOptions, ...options };

  try {
    return new Intl.NumberFormat('en-US', formatOptions).format(num);
  } catch (error) {
    return num;
  }
};

export const formatPercentage = (value, total) => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
};

/**
 * Array utilities
 */
export const groupBy = (array, keyFn) => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, keyFn, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = (array, keyFn) => {
  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Object utilities
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));

  const cloned = {};
  Object.keys(obj).forEach((key) => {
    cloned[key] = deepClone(obj[key]);
  });

  return cloned;
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const pick = (obj, keys) => {
  const result = {};
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

/**
 * Validation utilities
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Error utilities
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

export const logError = (error, context = '') => {
  // Error logging disabled in production
};

/**
 * Performance utilities
 */
export const createDebounced = (fn, delay) => {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };

  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
};

export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const result = await fn(...args);
    return result;
  };
};

/**
 * Color utilities
 */
export const hexToRgba = (hex, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const utils = {
  // Status
  getStatusColor,
  getStatusText,

  // Device
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,

  // Async
  debounce,
  throttle,
  createDebounced,

  // Storage
  storage,
  cache,

  // URL
  buildUrl,
  parseQueryParams,

  // Date
  formatDate,
  formatRelativeTime,
  formatLocalTime,

  // Number
  formatNumber,
  formatPercentage,

  // Array
  groupBy,
  sortBy,
  uniqueBy,

  // Object
  deepClone,
  isEmpty,
  pick,
  omit,

  // Validation
  isValidEmail,
  isValidUrl,

  // Error
  getErrorMessage,
  logError,

  // Performance
  measurePerformance,

  // Color
  hexToRgba,
};

export default utils;

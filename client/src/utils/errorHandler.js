/**
 * Error Handler Utility
 * Provides user-friendly error messages for API failures
 */

/**
 * Get user-friendly error message from API error
 * Handles different error types and provides contextual guidance
 */
export const getErrorMessage = (error, context = '') => {
  // Handle network errors
  if (!error.response) {
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  const status = error.response?.status;
  const data = error.response?.data;
  const requestUrl = String(error.config?.url || '').toLowerCase();
  const normalizedContext = String(context || '').toLowerCase();

  const isAuthRequest =
    requestUrl.includes('/auth/') ||
    normalizedContext.includes('login') ||
    normalizedContext.includes('register') ||
    normalizedContext.includes('auth');

  const isFoodAnalyzerRequest =
    requestUrl.includes('/upload') ||
    requestUrl.includes('/food') ||
    normalizedContext.includes('food') ||
    normalizedContext.includes('upload') ||
    normalizedContext.includes('analy');

  // Handle quota/rate-limit errors with context-aware messaging.
  // Avoid showing food analyzer messages for auth/login failures.
  if (status === 429 || data?.message?.includes('limit') || data?.message?.includes('quota')) {
    if (isAuthRequest) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }

    if (!isFoodAnalyzerRequest) {
      return 'Too many requests right now. Please try again shortly.';
    }

    return '🔄 Food analyzer quota reached. Please try again later or log your meal manually.';
  }

  // Handle server-provided error message
  if (data?.message) {
    return data.message;
  }

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      return `Invalid input. ${context ? `Please check your ${context}.` : 'Please try again.'}`;
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return `${context || 'Resource'} not found.`;
    case 500:
      return 'Server error. This has been reported to our team. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again in a moment.';
    case 503:
      return 'Service is under maintenance. Please try again later.';
    default:
      return `Error (${status}): ${error.message || 'An error occurred.'}`;
  }
};

/**
 * Categorize error type for better handling
 */
export const getErrorType = (error) => {
  if (!error.response) return 'network';
  if (error.response.status === 429) return 'quota';
  if (error.response.status >= 500) return 'server';
  if (error.response.status >= 400) return 'client';
  return 'unknown';
};

/**
 * Extract detailed error info for logging
 */
export const getErrorDetails = (error, context = '') => {
  return {
    message: getErrorMessage(error, context),
    type: getErrorType(error),
    status: error.response?.status,
    context,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Handle specific error scenarios with recovery suggestions
 */
export const getErrorWithSuggestion = (error, context = '') => {
  const message = getErrorMessage(error, context);
  const type = getErrorType(error);

  let suggestion = '';
  switch (type) {
    case 'network':
      suggestion = 'Check your internet connection';
      break;
    case 'quota':
      suggestion = 'Try logging the meal manually instead';
      break;
    case 'server':
      suggestion = 'This is temporary, please try again soon';
      break;
    default:
      break;
  }

  return { message, suggestion };
};

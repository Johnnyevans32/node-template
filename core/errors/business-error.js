const throwAppError = require('./app-error');

/**
 * Throw a business rule error with a custom code included in the response body
 * @param {string} message - Human-readable error message
 * @param {string} errorCode - Template error code that maps to an HTTP status (from ERROR_CODE)
 * @param {string} businessCode - The business rule code (e.g. SL02, AC01) sent in the response
 */
function throwBusinessError(message, errorCode, businessCode) {
  try {
    throwAppError(message, errorCode);
  } catch (error) {
    error.businessCode = businessCode;
    throw error;
  }
}

module.exports = throwBusinessError;

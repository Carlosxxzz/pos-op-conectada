/**
 * Centralized error handling for the application
 * Prevents crashes and provides user-friendly error messages
 */

import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public userMessage: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // Authentication errors
  AUTH_NO_SESSION: 'AUTH_NO_SESSION',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Database errors
  DB_FETCH_FAILED: 'DB_FETCH_FAILED',
  DB_CREATE_FAILED: 'DB_CREATE_FAILED',
  DB_UPDATE_FAILED: 'DB_UPDATE_FAILED',
  DB_DELETE_FAILED: 'DB_DELETE_FAILED',
  DB_NOT_FOUND: 'DB_NOT_FOUND',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',

  // Upload errors
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  UPLOAD_TOO_LARGE: 'UPLOAD_TOO_LARGE',
  UPLOAD_INVALID_FILE: 'UPLOAD_INVALID_FILE',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export function handleError(
  error: any,
  page: string,
  action: string,
  context?: any
): { userMessage: string; code: string } {
  let code = ErrorCodes.UNKNOWN_ERROR;
  let userMessage = 'Ocorreu um erro inesperado. Por favor, tente novamente.';

  // Log the error
  logger.error(page, action, 'Error occurred', error, context);

  // Handle specific error types
  if (error instanceof AppError) {
    code = error.code;
    userMessage = error.userMessage;
  } else if (error?.message?.includes('WDE0109') || error?.message?.includes('Payload is too large')) {
    code = ErrorCodes.UPLOAD_TOO_LARGE;
    userMessage = 'Arquivo muito grande. Por favor, tente com um arquivo menor.';
  } else if (error?.message?.includes('network') || error?.message?.includes('connection')) {
    code = ErrorCodes.NETWORK_ERROR;
    userMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
  } else if (error?.message?.includes('timeout')) {
    code = ErrorCodes.NETWORK_TIMEOUT;
    userMessage = 'Operação demorou muito. Por favor, tente novamente.';
  } else if (error?.message?.includes('not found') || error?.message?.includes('404')) {
    code = ErrorCodes.DB_NOT_FOUND;
    userMessage = 'Dados não encontrados. Por favor, tente novamente.';
  } else if (error?.message?.includes('unauthorized') || error?.message?.includes('401')) {
    code = ErrorCodes.AUTH_UNAUTHORIZED;
    userMessage = 'Você não tem permissão para acessar este recurso.';
  }

  return { userMessage, code };
}

export function isAuthError(code: string): boolean {
  return code.startsWith('AUTH_');
}

export function isNetworkError(code: string): boolean {
  return code.startsWith('NETWORK_');
}

export function isUploadError(code: string): boolean {
  return code.startsWith('UPLOAD_');
}

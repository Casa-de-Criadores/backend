import {
  Catch,
  ExceptionFilter,
  HttpContext,
  HttpException,
  Injectable,
} from '@danet/core';
import { ZodError } from 'zod';

/**
 * Extended HTTP status codes with more specific options.
 * Now our circus has more acts! 🎪
 */
export enum HttpStatus {
  // 2xx - Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 4xx - Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  UNSUPPORTED_MEDIA_TYPE = 415,
  TOO_MANY_REQUESTS = 429,

  // 5xx - Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Error code enum for more specific error categorization.
 * Think of these as our different clown personas! 🤡
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MISSING_FIELD = 'MISSING_FIELD',

  // Authentication/Authorization errors
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Default
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Enhanced custom exception with support for error codes and optional details.
 * Now we're not just any circus, we're a *fancy* circus! 🎭
 */
export class CustomException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly help?: string;

  constructor(
      statusCode: number,
      message: string,
      options?: {
        errorCode?: ErrorCode;
        details?: Record<string, any>;
        help?: string;
      }
  ) {
    super(statusCode, message);
    this.errorCode = options?.errorCode || this.deriveErrorCode(statusCode);
    this.details = options?.details;
    this.help = options?.help;
  }

  /**
   * Derives an appropriate error code based on status code if not provided
   */
  private deriveErrorCode(statusCode: number): ErrorCode {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED_ACCESS;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.INSUFFICIENT_PERMISSIONS;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.RESOURCE_CONFLICT;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCode.INTERNAL_ERROR;
      default:
        return ErrorCode.UNKNOWN_ERROR;
    }
  }
}

/**
 * Factory methods for common exceptions to keep our code DRY.
 * The whole circus doesn't need to set up the tent every time! 🎪
 */
export class Exceptions {
  static badRequest(message: string, options?: { errorCode?: ErrorCode; details?: Record<string, any>; help?: string }) {
    return new CustomException(HttpStatus.BAD_REQUEST, message, options);
  }

  static unauthorized(message: string = 'Unauthorized access', options?: { errorCode?: ErrorCode; details?: Record<string, any>; help?: string }) {
    return new CustomException(HttpStatus.UNAUTHORIZED, message, options);
  }

  static forbidden(message: string = 'Insufficient permissions', options?: { errorCode?: ErrorCode; details?: Record<string, any>; help?: string }) {
    return new CustomException(HttpStatus.FORBIDDEN, message, options);
  }

  static notFound(resource: string, id?: string | number, options?: { errorCode?: ErrorCode; details?: Record<string, any>; help?: string }) {
    const message = id
        ? `${resource} with id '${id}' not found`
        : `${resource} not found`;
    return new CustomException(HttpStatus.NOT_FOUND, message, options);
  }

  static conflict(message: string, options?: { errorCode?: ErrorCode; details?: Record<string, any>; help?: string }) {
    return new CustomException(HttpStatus.CONFLICT, message, options);
  }

  static internalError(message: string = 'An unexpected error occurred', options?: { errorCode?: ErrorCode; details?: Record<string, any>; help?: string }) {
    return new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, message, options);
  }

  static fromZodError(error: ZodError, options?: { statusCode?: number; errorCode?: ErrorCode; help?: string }) {
    const message = getZodMessage(error);
    const details = getZodDetails(error);

    return new CustomException(
        options?.statusCode || HttpStatus.BAD_REQUEST,
        message,
        {
          errorCode: options?.errorCode || ErrorCode.VALIDATION_FAILED,
          details,
          help: options?.help,
        }
    );
  }
}

/**
 * Enhanced exception filter with environment-aware error responses.
 * We know when to put on the big clown shoes! 🤡
 */
@Injectable()
@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  // Flag to control detailed error outputs in responses
  private readonly isProduction = Deno.env.get('NODE_ENV') === 'production';

  catch(exception: HttpException, ctx: HttpContext) {
    console.error('🎪 Exception caught:', exception);

    const status = exception.status;
    const isCustomException = exception instanceof CustomException;

    // Derive the enum key, e.g. BAD_REQUEST or UNAUTHORIZED
    const statusKey = Object.keys(HttpStatus).find(
        (k) => (HttpStatus as any)[k] === status,
    );

    // Convert "BAD_REQUEST" → "Bad Request"
    const errorText = statusKey
        ? statusKey
            .split('_')
            .map((w) => w[0] + w.slice(1).toLowerCase())
            .join(' ')
        : exception.name || 'Error';

    // Build the response body with base fields
    const responseBody: Record<string, any> = {
      statusCode: status,
      error: errorText,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: ctx.req.url,
    };

    // Add extra fields for CustomException
    if (isCustomException) {
      const customEx = exception as CustomException;
      responseBody.code = customEx.errorCode;

      // Only include details in non-production environments or if explicitly for client
      if (customEx.details && (!this.isProduction || customEx.errorCode.startsWith('VALIDATION'))) {
        responseBody.details = customEx.details;
      }

      // Include help message if available
      if (customEx.help) {
        responseBody.help = customEx.help;
      }
    }

    // Add request ID if available in the context
    const requestId = ctx.req.header('x-request-id');
    if (requestId) {
      responseBody.requestId = requestId;
    }

    // If we're in a non-production environment, add stack trace for 5xx errors
    if (!this.isProduction && status >= 500) {
      responseBody.stack = exception.stack;
    }

    const body = JSON.stringify(responseBody);

    return ctx.newResponse(body, {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Extracts the first Zod validation error message.
 * Simple but effective, like a classic banana peel slip! 🍌
 */
export function getZodMessage(error: ZodError): string {
  const { formErrors, fieldErrors } = error.flatten();
  if (formErrors.length) {
    return formErrors.join('; ');
  }
  const fieldErrs = Object.values(fieldErrors).flat();
  return fieldErrs.length ? fieldErrs.join('; ') : 'Invalid input';
}

/**
 * Extracts structured details from Zod errors for more helpful responses.
 * Now we're juggling ALL the validation errors! 🤹‍♂️
 */
export function getZodDetails(error: ZodError): Record<string, any> {
  const { fieldErrors } = error.flatten();

  // If there are no field errors, return the first error issue
  if (Object.keys(fieldErrors).length === 0 && error.issues.length > 0) {
    return {
      issues: error.issues.map(issue => ({
        path: issue.path,
        code: issue.code,
        message: issue.message,
      })),
    };
  }

  // Structure the field errors in a more readable format
  const details: Record<string, string[]> = {};

  for (const [field, errors] of Object.entries(fieldErrors)) {
    if (errors && errors.length > 0) {
      details[field] = errors;
    }
  }

  return { fields: details };
}

/**
 * Type guard to check if an error is a Zod error.
 * Safety first in our circus! 🎪
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

/**
 * Helper to safely handle any error and convert to CustomException.
 * For when the lions escape their cages! 🦁
 */
export function handleError(error: unknown, defaultMessage: string = 'An unexpected error occurred'): never {
  console.error('🤡 Error caught:', error);

  // If it's already a CustomException, just throw it
  if (error instanceof CustomException) {
    throw error;
  }

  // Handle Zod validation errors
  if (isZodError(error)) {
    throw Exceptions.fromZodError(error);
  }

  // Handle standard HttpExceptions
  if (error instanceof HttpException) {
    throw new CustomException(
        error.status,
        error.message,
        { errorCode: ErrorCode.UNKNOWN_ERROR }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    throw new CustomException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message || defaultMessage,
        { errorCode: ErrorCode.INTERNAL_ERROR }
    );
  }

  // Handle unknown errors
  throw new CustomException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      defaultMessage,
      { errorCode: ErrorCode.UNKNOWN_ERROR }
  );
}
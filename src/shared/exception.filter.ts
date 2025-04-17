import { Catch, ExceptionFilter, HttpContext, HttpException, Injectable } from '@danet/core';
import { ZodError } from "zod";

/**
 * Standard HTTP status codes for use with CustomException.
 */
export enum HttpStatus {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
}

export class CustomException extends HttpException {
    constructor(statusCode: number, message: string) {
        super(statusCode, message);
    }
}

/**
 * Custom exception extending Danet's HttpException,
 * allowing us to throw with a specific status code.
 */
@Injectable()
@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, ctx: HttpContext) {
        const status = exception.status;

// Derive the enum key, e.g. BAD_REQUEST or UNAUTHORIZED
        const statusKey = Object.keys(HttpStatus).find(
            (k) => (HttpStatus as any)[k] === status
        );

// Convert "BAD_REQUEST" → "Bad Request"
        const errorText = statusKey
            ? statusKey
                .split('_')
                .map(w => w[0] + w.slice(1).toLowerCase())
                .join(' ')
            : exception.name || 'Error';

        const body = JSON.stringify({
            statusCode: status,
            error:      errorText,
            message:    exception.message,
            timestamp:  new Date().toISOString(),
            path:       ctx.req.url,
        });
        return ctx.newResponse(body, {
            status,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

/**
 * Extracts the first Zod validation error message.
 */
export function getZodMessage(error: ZodError): string {
    const { formErrors, fieldErrors } = error.flatten();
    if (formErrors.length) {
        return formErrors.join('; ');
    }
    const fieldErrs = Object.values(fieldErrors).flat();
    return fieldErrs.length ? fieldErrs.join('; ') : 'Invalid input';
}
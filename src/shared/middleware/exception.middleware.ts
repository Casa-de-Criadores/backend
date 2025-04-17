import {
    NextFunction,
    HttpContext,
    HttpException,
} from '@danet/core';
import { ZodError } from 'zod';
import {HttpStatus} from "../exception.filter.ts";

/**
 * Global middleware to catch and format all errors into proper HTTP responses.
 */
export async function exceptionHandler(
    ctx: HttpContext,
    next: NextFunction
): Promise<Response | void> {
    try {
        return await next();
    } catch (err: unknown) {
        let statusCode: number, errorName: string, message: string;

        if (err instanceof HttpException) {
            statusCode = err.status;
            errorName  = err.name;
            message    = err.message;
        } else if (err instanceof ZodError) {
            statusCode = HttpStatus.BAD_REQUEST;
            errorName  = 'Bad Request';
            const { formErrors, fieldErrors } = err.flatten();
            message = formErrors.length
                ? formErrors.join('; ')
                : Object.values(fieldErrors).flat()[0] ?? 'Invalid input';
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errorName  = 'Internal Server Error';
            message    = 'An unexpected error occurred';
            console.error(err);
        }

        return ctx.newResponse(
            JSON.stringify({
                statusCode,
                error: errorName,
                message,
                timestamp: new Date().toISOString(),
                path: ctx.req.url,
            }),
            {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
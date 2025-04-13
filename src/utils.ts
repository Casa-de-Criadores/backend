import { Catch, ExceptionFilter, HttpContext, Injectable } from '@danet/core';
import { ZodError } from "zod";

export const HttpStatus = {
    NOT_FOUND: { code: 404, name: 'Not Found' },
    BAD_REQUEST: { code: 400, name: 'Bad Request' },
    FORBIDDEN: { code: 403, name: 'Forbidden' },
    UNAUTHORIZED: { code: 401, name: 'Unauthorized' },
    INTERNAL_SERVER_ERROR: { code: 500, name: 'Internal Server Error' },
};

export class CustomException extends Error {
    status: { code: number; name: string };

    constructor(message: string, status: { code: number; name: string }) {
        super(message);
        this.name = message;
        this.status = status;
    }
}

@Injectable()
@Catch(CustomException)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: CustomException, ctx: HttpContext) {
        const request = ctx.req;
        const status = exception.status;

        const body = {
            statusCode: status.code,
            error: status.name,
            message: exception.message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        return ctx.newResponse(JSON.stringify(body), {
            status: status.code,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export function getZodMessage(error: ZodError): string {
    const { formErrors, fieldErrors } = error.flatten();
    return formErrors[0] ?? Object.values(fieldErrors).flat()[0] ?? 'Invalid input';
}
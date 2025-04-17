import { Reflect } from "https://deno.land/x/reflect_metadata@v0.1.12/mod.ts";
import {
    Injectable,
    AuthGuard,
    ExecutionContext,
} from '@danet/core';
import { CustomException, HttpStatus } from '../exception.filter.ts'


@Injectable()
export class RoleGuard implements AuthGuard {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const user = context.get('user');

        const handler = typeof context.getHandler === 'function'
            ? context.getHandler()
            : undefined;

        const roles = Reflect.getMetadata('roles', handler) ?? [];

        if (!user || !(roles.includes(user.role) || user.role === 'super')) {
            throw new CustomException(
                HttpStatus.UNAUTHORIZED,
                'Unauthorized: Insufficient role or not logged in'
            );
        }

        return true;
    }
}
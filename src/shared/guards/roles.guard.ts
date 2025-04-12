import {
    Injectable,
    AuthGuard,
    ExecutionContext,
    HttpContext,
} from '@danet/core';
import { CustomException, HttpStatus } from '../../utils.ts'

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
                'Unauthorized: Insufficient role or not logged in',
                HttpStatus.UNAUTHORIZED
            );
        }

        return true;
    }
}
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
        console.log('[GUARD] Full context:', context);

        // Use context.get('user') directly since context itself exposes get
        const user = context.get('user');
        console.log('[GUARD] Retrieved user:', user);

        const handler = typeof context.getHandler === 'function'
            ? context.getHandler()
            : undefined;
        console.log('[GUARD] Handler:', handler);

        const roles = Reflect.getMetadata('roles', handler) ?? [];
        console.log('[GUARD] Retrieved roles:', roles);

        if (!user || !(roles.includes(user.role) || user.role === 'super')) {
            console.error('[GUARD] Unauthorized access attempt detected.');
            throw new CustomException(
                'Unauthorized: Insufficient role or not logged in',
                HttpStatus.UNAUTHORIZED
            );
        }

        return true;
    }
}
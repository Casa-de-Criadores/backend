// RoleGuard.ts
import { Reflect } from 'https://deno.land/x/reflect_metadata@v0.1.12/mod.ts';
import { AuthGuard, ExecutionContext, Injectable } from '@danet/core';
import { CustomException, HttpStatus } from '../exception.filter.ts';
import { AuthService } from '../../auth/service.ts';

@Injectable()
export class RoleGuard implements AuthGuard {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get auth header directly
    const req = context.req;
    const authHeader = req.header('authorization');
    console.log('🎭 Auth header:', authHeader);

    let user = null;

    // Extract user from JWT token
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        user = await this.authService.verifyToken(token);
        console.log('🎭 Token payload:', user);

        // Store user in context for other handlers
        context.set('user', user);
      } catch (error) {
        console.error('🤡 Token verification failed:', error);
        throw new CustomException(
            HttpStatus.UNAUTHORIZED,
            'Authentication failed: Invalid or expired token',
        );
      }
    } else if (authHeader) {
      // Auth header exists but wrong format
      throw new CustomException(
          HttpStatus.UNAUTHORIZED,
          'Authentication format invalid: Bearer token required',
      );
    } else {
      // No auth header
      throw new CustomException(
          HttpStatus.UNAUTHORIZED,
          'Authentication required: Missing authorization header',
      );
    }

    // Now check roles
    const handler = typeof context.getHandler === 'function'
        ? context.getHandler()
        : undefined;
    const roles = Reflect.getMetadata('roles', handler) ?? [];

    console.log('⚠️ Required roles:', roles);
    console.log('⚠️ User role:', user?.role);

    // Check if user has required role or is super user
    if (roles.length > 0 && !(roles.includes(user.role) || user.role === 'super')) {
      throw new CustomException(
          HttpStatus.FORBIDDEN,
          `Access denied: Required role(s): ${roles.join(', ')}`,
      );
    }

    return true;
  }
}
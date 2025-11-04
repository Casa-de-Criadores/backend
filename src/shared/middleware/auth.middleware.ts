import {
  DanetMiddleware,
  HttpContext,
  Injectable,
  NextFunction,
} from '@danet/core';
import { AuthService } from '../../auth/service.ts';

@Injectable()
export class AuthMiddleware implements DanetMiddleware {
  constructor(private readonly authService: AuthService) {}

  // Define public routes that bypass auth
  private static readonly PUBLIC_ROUTES = new Set([
    'POST:/auth/login',
    'POST:/auth/register',
    'GET:/auth/ping',
    'GET:/', // home route, if needed
  ]);

  private normalizePath(path: string): string {
    return path.replace(/\/+$/, '') || '/';
  }

  private isPublic(ctx: HttpContext): boolean {
    const method = ctx.req.method.toUpperCase();
    const rawUrl = ctx.req.url;
    const path = this.normalizePath(rawUrl);
    const key = `${method}:${path}`;

    console.log('🔍 Checking public route key:', key);
    const match = AuthMiddleware.PUBLIC_ROUTES.has(key);
    if (match) {
      console.log(`🎭 Skipping auth middleware for public route: ${key}`);
    }
    return match;
  }


  async action(ctx: HttpContext, next: NextFunction) {
    if (this.isPublic(ctx)) {
      return await next();
    }

    console.log('🎪 AUTH MIDDLEWARE RUNNING');
    const authHeader = ctx.req.header('authorization');
    console.log('🎪 Auth Header:', authHeader);

    // Handle test tokens
    if (authHeader?.startsWith('Bearer faketoken-with-role-')) {
      const role = authHeader.replace('Bearer faketoken-with-role-', '').trim();
      ctx.set('user', { id: 'mock-id', role });
      console.log('🎪 Injected mock user:', ctx.get('user'));
    }
    // Handle real JWT tokens
    else if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('🎪 Token extracted:', token.substring(0, 20) + '...');
        const payload = await this.authService.verifyToken(token);
        console.log('🎪 Token payload:', payload);
        ctx.set('user', payload);
        console.log('🎪 User set in context:', ctx.get('user'));
      } catch (error) {
        console.error('🤡 Token verification failed:', error);
        // optionally, block the request entirely here with a 401
        // ctx.throw(HttpStatus.UNAUTHORIZED, 'Invalid token');
      }
    } else {
      console.log('🎪 No valid auth header found');
    }

    await next();
  }
}
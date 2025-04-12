import { Injectable } from '@danet/core';

@Injectable()
export class AuthMiddleware implements DanetMiddleware {
    async action(ctx: HttpContext, next: NextFunction) {
        const authHeader = ctx.req.header('authorization');

        if (authHeader?.startsWith('Bearer faketoken-with-role-')) {
            const role = authHeader.replace('Bearer faketoken-with-role-', '').trim();

            // Inject directly into context
            ctx.set('user', { id: 'mock-id', role });

            console.log('[AUTH MIDDLEWARE] Injected user:', ctx.get('user'));
        } else {
            console.log('[AUTH MIDDLEWARE] No valid auth header found');
        }

        await next(); // let request proceed
    }
}

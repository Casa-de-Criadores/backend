import { Reflect } from 'https://deno.land/x/reflect_metadata@v0.1.12/mod.ts';
import { createParamDecorator } from '@danet/core';
import { HttpContext } from '@danet/core';
import { CustomException, HttpStatus } from '../exception.filter.ts';

// Store roles as a symbol to avoid name collisions
const ROLES_KEY = Symbol('roles');

export function Roles(...roles: string[]) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('roles', roles, descriptor.value);
    return descriptor;
  };
}

// Create a helper to get roles metadata
export function getRolesMetadata(target: any, method?: string): string[] {
  if (method) {
    return Reflect.getMetadata(ROLES_KEY, target, method) || [];
  }
  return Reflect.getMetadata(ROLES_KEY, target) || [];
}

export const User = createParamDecorator((context: HttpContext) => {
  const user = context.get('user');
  if (!user) {
    throw new CustomException(
      HttpStatus.UNAUTHORIZED,
      'User not found in context',
    );
  }
  return user;
});

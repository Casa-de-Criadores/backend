import { Reflect } from "https://deno.land/x/reflect_metadata@v0.1.12/mod.ts";

export function Roles(...roles: string[]) {
    return (target: unknown, _key: string, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata('roles', roles, descriptor.value);
    };
}
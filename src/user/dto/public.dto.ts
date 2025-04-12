import { UserRole } from '../constants.ts';
import { z } from "zod";

export class UpdateUserDto {
    login?: string;
    email?: string;
    role?: UserRole;
    isDisabled?: boolean;
}

export class CreateUserDto {
    constructor(
        public login: string,
        public email: string,
        public password: string,
        public role: UserRole
    ) {}
}


export class UserPublicDto {
    constructor(
        public id: string,
        public login: string,
        public email: string,
        public role: UserRole,
    ) {}
}

export const baseUserSchema = z.object({
    login: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'customer', 'brand']),
});

// used for POST /user
export const createUserSchema = baseUserSchema;

// used for PUT /user/:id
export const updateUserSchema = baseUserSchema.partial();

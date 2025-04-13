import { UserRole } from '../constants.ts';
import { z } from "zod";

export class UserPublicDto {
    constructor(
        public id?: string,
        public login?: string,
        public email?: string,
        public role?: UserRole,
        public isDisabled?: boolean
    ) {}
}

export class CreateUserDto {
    constructor(
        public login: string,
        public email: string,
        public password: string,
        public role: UserRole
    ) {}
}

export class UpdateUserDto {
    login?: string;
    email?: string;
    role?: UserRole;
    isDisabled?: boolean;
}

export class DeleteUserDto {
    constructor(
        public success: boolean,
        public message: string,
    ) {}
}

const userShape = {
    login: z.string().min(3, { message: 'Login must be at least 3 characters' }),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    role: z.enum(['admin', 'customer', 'brand'], { message: 'Invalid role' }),
};

// POST /user
export const createUserSchema = z.object(userShape);

// PUT /user/:id
export const updateUserSchema = z
    .object(userShape)
    .partial()
    .refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided to update',
    });

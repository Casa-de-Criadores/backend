import { UserRole } from '../constants.ts';

export class User {
    public id: string;
    public login: string;
    public email: string;
    public passwordHash: string;
    public role: UserRole;
    public createdAt: string;
    public lastLoginAt: string;
    public isDisabled: boolean;

    constructor(params: {
        id: string;
        login: string;
        email: string;
        passwordHash: string;
        role: UserRole;
        createdAt?: string;
        lastLoginAt?: string;
        isDisabled?: boolean;
    }) {
        this.id = params.id;
        this.login = params.login;
        this.email = params.email;
        this.passwordHash = params.passwordHash;
        this.role = params.role;
        // If no createdAt is provided, default to current timestamp.
        this.createdAt = params.createdAt ?? new Date().toISOString();
        // If lastLoginAt is not provided, default to an empty string.
        this.lastLoginAt = params.lastLoginAt ?? "";
        // If isDisabled is not provided, default to false.
        this.isDisabled = params.isDisabled ?? false;
    }
}

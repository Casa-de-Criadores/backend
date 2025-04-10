// identity, authentication, and permissions
import { UserRole } from './constants.ts';
type ProfileStatus = 'active' | 'pending' | 'inactive';

export class User {
    constructor(
    public id: string,
    public login: string,
    public email: string,
    public passwordHash: string, // tbd hash encryption
    public role: UserRole,
    public createdAt: string, // ISO timestamp
    public lastLoginAt?: string, // for auditing / UX
    public isDisabled?: boolean, // soft bans, inactive accounts
    ) {}
}

export class UserPublic {
    constructor(
        public id: string,
        public login: string,
        public email: string,
        public role: UserRole,
        public createdAt: string,
        public lastLoginAt?: string,
        public isDisabled?: boolean
    ) {}
}

// public-facing display layer
export class BaseProfile {
    id!: string;
    userId!: string;
    createdAt!: string;
    status!: ProfileStatus;
}

export class BrandProfile extends BaseProfile {
    title!: string;
    slug!: string;
    bio?: string;
    website?: string;
    logoUrl?: string;
}

export class CustomerProfile extends BaseProfile {
    displayName?: string;
    avatarUrl?: string;
    preferences?: Record<string, unknown>;
    language?: string;
}

import { UserRole } from '../constants.ts';

export class User {
    constructor(
        public id: string,
        public login: string,
        public email: string,
        public passwordHash: string,
        public role: UserRole,
        public createdAt: string,
        public lastLoginAt?: string,
        public isDisabled?: boolean
    ) {}
}

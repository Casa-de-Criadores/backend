import { UserRole } from '../constants.ts';

export class CreateUserDto {
    constructor(
        public login: string,
        public email: string,
        public password: string,
        public role: UserRole
    ) {}
}
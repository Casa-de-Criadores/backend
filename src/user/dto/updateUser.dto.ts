import { UserRole } from '../constants.ts';

export class UpdateUserDto {
    login?: string;
    email?: string;
    role?: UserRole;
    isDisabled?: boolean;
}

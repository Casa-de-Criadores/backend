import { User } from '../models/models.ts';
import { UserPublicDto } from '../dto/public.dto.ts';

export function toPublicDto(user: User): UserPublicDto {
    return new UserPublicDto(
        user.id,
        user.login,
        user.email,
        user.role,
        user.isDisabled
    );
}


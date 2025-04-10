import { User } from '../models/models.ts';
import { UserPublicDto } from '../dto/userPublic.dto.ts';

export function toUserPublicDto(user: User): UserPublicDto {
    return new UserPublicDto(
        user.id,
        user.login,
        user.email,
        user.role,
        user.createdAt,
        user.lastLoginAt,
        user.isDisabled
    );
}

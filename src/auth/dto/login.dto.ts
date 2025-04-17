import { z } from 'zod';
import {UserPublicDto} from "../../user/dto/public.dto.ts";

export class LoginDto {
    constructor(
        public login: string,
        public password: string
    ) {}
}
export const loginSchema = z.object({
    login: z.string().min(3),
    password: z.string().min(8),
});

export class LoginResponseDto {
    constructor(
        public token: string,
        public user: UserPublicDto
    ) {}

    static from(token: string, user: UserPublicDto) {
        return new LoginResponseDto(token, user);
    }
}

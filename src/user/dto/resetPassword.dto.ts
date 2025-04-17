// dto/resetPassword.dto.ts
import { z } from "zod";

export class ResetPasswordDto {
    passwordHash!: string;
}

export const resetPasswordSchema = z.object({
    passwordHash: z.string().min(8),
});

// dto/resetPassword.dto.ts
import { z } from "zod";

export class ResetPasswordDto {
    password: string;
}

export const resetPasswordSchema = z.object({
    password: z.string().min(8),
});

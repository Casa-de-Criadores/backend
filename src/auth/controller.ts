// AuthController.ts
import {Body, Controller, Post} from '@danet/core';
import {ReturnedType} from '@danet/swagger/decorators';
import {LoginDto, LoginResponseDto, loginSchema} from './dto/login.dto.ts';
import {AuthService} from "./service.ts";
import {CustomException, getZodMessage, HttpStatus} from "../shared/exception.filter.ts";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ReturnedType(LoginResponseDto)
  async login(@Body() raw: unknown): Promise<LoginResponseDto> {
    console.log('[Controller] Raw login input:', raw);

    const result = loginSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(
          HttpStatus.BAD_REQUEST,
          getZodMessage(result.error),
      );
    }

    const dto = new LoginDto(result.data.login, result.data.password);

    try {
      const response = await this.authService.login(dto);

      if (!response) {
        throw new CustomException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'No response from login'
        );
      }

      console.log('[Controller] Login succeeded:', response.user.login);
      return LoginResponseDto.from(response.token, response.user);
    } catch (error: unknown) {
      // Determine appropriate error based on error type
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('not found') || errorMessage.includes('password')) {
        throw new CustomException(
            HttpStatus.UNAUTHORIZED,
            'Invalid credentials'
        );
      } else {
        console.error('[Controller] Unexpected error during login:', error);
        throw new CustomException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'An error occurred during authentication'
        );
      }
    }
  }
}
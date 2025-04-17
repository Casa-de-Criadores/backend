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
    // 1) Zod validation
    const result = loginSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        getZodMessage(result.error),
      );
    }

    // 2) Build DTO
    const dto = new LoginDto(result.data.login, result.data.password);

    // 3) Delegate to service
    const { token, user } = await this.authService.login(dto);

    // 4) Return typed response
    return LoginResponseDto.from(token, user);
  }
}

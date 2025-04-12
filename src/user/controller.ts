import { Body, Controller, Delete, Get, Param, Post, Put } from '@danet/core';
import { ReturnedType } from '@danet/swagger/decorators';
import { UserService } from './service.ts';
import { UserPublicDto, CreateUserDto, UpdateUserDto, createUserSchema, updateUserSchema} from './dto/public.dto.ts';
import { resetPasswordSchema } from './dto/resetPassword.dto.ts';
import { CustomException, HttpStatus } from '../utils.ts';


@Controller('user')
export class UserController {
  constructor(public userService: UserService) {}

  @ReturnedType(UserPublicDto, true)
  @Get()
  getAllUsers() {
    return this.userService.getAll();
  }

  @ReturnedType(UserPublicDto, true)
  @Get(':id')
  getUserById(@Param('id') userId: string) {
    return this.userService.getById(userId);
  }

  @ReturnedType(UserPublicDto, true)
  @Post()
  async createUser(@Body() raw: unknown): Promise<UserPublicDto> {
    const result = createUserSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(result.error.flatten(), HttpStatus.BAD_REQUEST);
    }
    const dto: CreateUserDto = result.data;
    return await this.userService.create(dto);
  }

  @ReturnedType(UserPublicDto, true)
  @Put(':id')
  updateUser(@Param('id') userId: string, @Body() raw: unknown): UserPublicDto {
    const result = updateUserSchema.safeParse(raw);

    if (!result.success) {
      throw new CustomException(result.error.flatten(), HttpStatus.BAD_REQUEST);
    }

    const dto: UpdateUserDto = result.data;
    return this.userService.update(userId, dto);
  }

  @ReturnedType(UserPublicDto, true)
  @Put(':id/password')
  async resetPassword(
      @Param('id') userId: string,
      @Body() raw: unknown
  ): Promise<UserPublicDto> {
    const result = resetPasswordSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(result.error.flatten(), HttpStatus.BAD_REQUEST);
    }

    return await this.userService.updatePassword(userId, result.data.password);
  }

  @Delete(':id')
  deleteUser(@Param('id') userId: string) {
    this.userService.deleteOneById(userId);
    return {
      success: true,
      message: `User '${userId}' thrown from the cannon and deleted.`,
    };
  }
}
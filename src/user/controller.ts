import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuard,
} from '@danet/core';
import { ReturnedType } from '@danet/swagger/decorators';
import { UserService } from './service.ts';
import {
  CreateUserDto,
  createUserSchema,
  DeleteUserDto,
  UpdateUserDto,
  updateUserSchema,
  UserPublicDto,
} from './dto/public.dto.ts';
import {
  ResetPasswordDto,
  resetPasswordSchema,
} from './dto/resetPassword.dto.ts';
import {
  CustomException,
  getZodMessage,
  HttpStatus,
} from '../shared/exception.filter.ts';
import { RoleGuard } from '../shared/guards/roles.guard.ts';
import { Roles } from '../shared/decorators/roles.decorator.ts';

@Controller('user')
export class UserController {
  constructor(public userService: UserService) {}

  @ReturnedType(UserPublicDto, true)
  @Get('')
  @Roles('admin', 'super')
  @UseGuard(RoleGuard)
  getAllUsers() {
    console.log('[CONTROLLER] getAllUsers triggered');
    return this.userService.getAll();
  }

  @ReturnedType(UserPublicDto)
  @Get(':id')
  @Roles('admin', 'super')
  @UseGuard(RoleGuard)
  getUserById(@Param('id') userId: string) {
    return this.userService.getById(userId);
  }

  @ReturnedType(UserPublicDto)
  @Post('')
  @Roles('admin', 'super')
  @UseGuard(RoleGuard)
  async createUser(@Body() raw: unknown): Promise<UserPublicDto> {
    const result = createUserSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        getZodMessage(result.error),
      );
    }
    const dto: CreateUserDto = result.data;
    return await this.userService.create(dto);
  }

  @ReturnedType(UserPublicDto)
  @Put(':id')
  @Roles('admin', 'super')
  @UseGuard(RoleGuard)
  async updateUser(
    @Param('id') userId: string,
    @Body() raw: unknown,
  ): Promise<UserPublicDto> {
    const result = updateUserSchema.safeParse(raw);

    if (!result.success) {
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        getZodMessage(result.error),
      );
    }

    const dto: UpdateUserDto = result.data;
    return await this.userService.update(userId, dto);
  }

  @ReturnedType(UserPublicDto)
  @Put(':id/resetPassword')
  @Roles('admin', 'super', 'brand', 'customer')
  @UseGuard(RoleGuard)
  async resetPassword(
    @Param('id') userId: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<UserPublicDto> {
    const result = resetPasswordSchema.safeParse(dto);

    if (!result.success) {
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        getZodMessage(result.error),
      );
    }

    return await this.userService.updatePassword(
      userId,
      result.data.passwordHash,
    );
  }

  @ReturnedType(DeleteUserDto)
  @Delete(':id')
  @Roles('admin', 'super')
  @UseGuard(RoleGuard)
  deleteUser(@Param('id') userId: string) {
    this.userService.deleteOneById(userId);
    return {
      success: true,
      message: `User '${userId}' thrown from the cannon and deleted.`,
    };
  }
}

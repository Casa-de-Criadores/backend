import { Body, Controller, Delete, Get, Param, Post, Put } from '@danet/core';
import { ReturnedType } from '@danet/swagger/decorators';
import { UserService } from './service.ts';
import { UserPublicDto } from './dto/userPublic.dto.ts';
import {User} from "./class.ts";

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
  createUser(@Body() user: User) {
    return this.userService.create(user);
  }

  @ReturnedType(UserPublicDto, true)
  @Put(':id')
  updateUser(@Param('id') userId: string, @Body() user: Partial<User>) {
    return this.userService.update(userId, user);
  }

  @Delete(':id')
  deleteUser(@Param('id') userId: string) {
    return this.userService.deleteOneById(userId);
  }
}

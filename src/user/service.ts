import {Injectable} from '@danet/core';
import {User as DbUser} from './class.ts';
import {CreateUserDto, UpdateUserDto, UserPublicDto,} from './dto/public.dto.ts';
import {CustomException, HttpStatus} from '../shared/exception.filter.ts';

@Injectable()
export class UserService {
  private users: DbUser[] = [];

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  getAll(): UserPublicDto[] {
    return this.users.map((u) =>
      new UserPublicDto(
        u.id,
        u.login,
        u.email,
        u.role,
        u.isDisabled,
      )
    );
  }

  getById(id: string): UserPublicDto {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `User with id '${id}' not found in the clown database.`,
      );
    }
    return new UserPublicDto(
      user.id,
      user.login,
      user.email,
      user.role,
      user.isDisabled,
    );
  }

  async create(dto: CreateUserDto): Promise<UserPublicDto> {
    const hashed = await this.hashPassword(dto.passwordHash);
    const now = new Date().toISOString();
    const dbUser: DbUser = {
      id: crypto.randomUUID(),
      login: dto.login,
      email: dto.email,
      passwordHash: hashed,
      role: dto.role,
      createdAt: now,
      lastLoginAt: now,
      isDisabled: false,
    };
    this.users.push(dbUser);
    return new UserPublicDto(
      dbUser.id,
      dbUser.login,
      dbUser.email,
      dbUser.role,
      dbUser.isDisabled,
    );
  }

  update(id: string, updateDto: UpdateUserDto): UserPublicDto {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `Cannot update: user '${id}' vanished into thin air.`,
      );
    }
    this.users[index] = { ...this.users[index], ...updateDto };
    const user = this.users[index];
    return new UserPublicDto(
      user.id,
      user.login,
      user.email,
      user.role,
      user.isDisabled,
    );
  }

  async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<UserPublicDto> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `User '${userId}' not found. Can't reset.`,
      );
    }
    this.users[index].passwordHash = await this.hashPassword(newPassword);
    const user = this.users[index];
    return new UserPublicDto(
      user.id,
      user.login,
      user.email,
      user.role,
      user.isDisabled,
    );
  }

  deleteOneById(id: string): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `Cannot delete: user '${id}' never existed in the circus tent.`,
      );
    }
    this.users.splice(index, 1);
  }

  getByLogin(login: string): DbUser {
    const user = this.users.find((u) => u.login === login);
    if (!user) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `No clown by login '${login}' in the tent.`,
      );
    }
    return user;
  }
}

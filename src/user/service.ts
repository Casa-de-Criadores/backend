import {Injectable} from '@danet/core';
import {User} from './class.ts';
import {CreateUserDto, UpdateUserDto, UserPublicDto} from './dto/public.dto.ts';
import {toPublicDto} from './mappers/mapper.ts';
import {CustomException, HttpStatus} from '../utils.ts';

@Injectable()
export class UserService {
  private users: User[] = [];

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  getAll(): UserPublicDto[] {
    return this.users.map(toPublicDto);
  }

  getById(id: string): UserPublicDto {
    const user = this.users.find(user => user.id === id);
    if (!user) {
      throw new CustomException(`User with id '${id}' not found in the clown database.`, HttpStatus.NOT_FOUND);
    }
    return toPublicDto(user);
  }

  async create(userDto: CreateUserDto): Promise<UserPublicDto> {
    const hashedPassword = await this.hashPassword(userDto.password);

    const user: User = new User(
        crypto.randomUUID(),
        userDto.login,
        userDto.email,
        hashedPassword,
        userDto.role,
        new Date().toISOString()
    );

    this.users.push(user);
    return toPublicDto(user);
  }

  update(id: string, user: UpdateUserDto): UserPublicDto {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) {
      throw new CustomException(`Cannot update: user '${id}' vanished into thin air.`, HttpStatus.NOT_FOUND);
    }
    this.users[index] = { ...this.users[index], ...user };
    return toPublicDto(this.users[index]);
  }

  async updatePassword(userId: string, newPassword: string): Promise<UserPublicDto> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new CustomException(`User '${userId}' not found. Can't reset.`, HttpStatus.NOT_FOUND);
    }

    this.users[index].passwordHash = await this.hashPassword(newPassword);

    return toPublicDto(this.users[index]);
  }

  deleteOneById(id: string): void {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) {
      throw new CustomException(`Cannot delete: user '${id}' never existed in the circus tent.`, HttpStatus.NOT_FOUND);
    }
    this.users.splice(index, 1);
  }
}

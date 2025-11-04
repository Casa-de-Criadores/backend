import { Injectable } from '@danet/core';
import { User } from './models/models.ts';
import {
  CreateUserDto,
  UpdateUserDto,
  UserPublicDto,
} from './dto/public.dto.ts';
import { CustomException, HttpStatus } from '../shared/exception.filter.ts';
import { DbClient } from '../database/client.ts';

@Injectable()
export class UserService {
  constructor(private readonly dbClient: DbClient) {}

  private mapDbRowToUser(row: Record<string, unknown>): User {
    console.log('🎭 Mapping DB row to User:', row);
    return new User({
      id: row.id as string,
      login: row.login as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      role: row.role as ('customer' | 'brand' | 'admin' | 'super'),
      createdAt: row.created_at as string,
      lastLoginAt: row.last_login_at as string,
      isDisabled: row.is_disabled as boolean,
    });
  }

  async getAll(): Promise<UserPublicDto[]> {
    console.log('🎪 Fetching all users...');
    const rows = await this.dbClient.query('SELECT * FROM users');
    return rows.map((row) => {
      const user = this.mapDbRowToUser(row as Record<string, unknown>);
      return new UserPublicDto(
        user.id,
        user.login,
        user.email,
        user.role,
        user.isDisabled,
      );
    });
  }

  async getById(id: string): Promise<UserPublicDto> {
    console.log('🎭 Looking for user by ID:', id);
    const row = await this.dbClient.queryOne(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );

    if (!row) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `User with id '${id}' not found in the clown database.`,
      );
    }

    const user = this.mapDbRowToUser(row as Record<string, unknown>);
    return new UserPublicDto(
      user.id,
      user.login,
      user.email,
      user.role,
      user.isDisabled,
    );
  }

  async create(dto: CreateUserDto): Promise<UserPublicDto> {
    console.log('🎪 Creating new user:', dto.login);

    const row = await this.dbClient.queryOne(
      `
      INSERT INTO users (
        id,
        login,
        email,
        password_hash,
        role,
        created_at,
        last_login_at,
        is_disabled
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4,
        now(), now(),
        false
      ) RETURNING *`,
      [dto.login, dto.email, dto.passwordHash, dto.role],
    );

    if (!row) {
      throw new CustomException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create user',
      );
    }

    const user = this.mapDbRowToUser(row as Record<string, unknown>);
    return new UserPublicDto(
      user.id,
      user.login,
      user.email,
      user.role,
      user.isDisabled,
    );
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<UserPublicDto> {
    const setValues: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(updateDto).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        setValues.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    values.push(id);
    const row = await this.dbClient.queryOne(
      `UPDATE users
       SET ${setValues.join(', ')}, updated_at = now()
       WHERE id = $${paramCount}
       RETURNING *`,
      values,
    );

    if (!row) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `Cannot update: user '${id}' vanished into thin air.`,
      );
    }

    const user = this.mapDbRowToUser(row as Record<string, unknown>);
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
    const row = await this.dbClient.queryOne(
      `UPDATE users
       SET password_hash = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [newPassword, userId],
    );

    if (!row) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `User '${userId}' not found. Can't reset.`,
      );
    }

    const user = this.mapDbRowToUser(row as Record<string, unknown>);
    return new UserPublicDto(
      user.id,
      user.login,
      user.email,
      user.role,
      user.isDisabled,
    );
  }

  async deleteOneById(id: string): Promise<void> {
    const row = await this.dbClient.queryOne(
      'SELECT id FROM users WHERE id = $1',
      [id],
    );

    if (!row) {
      throw new CustomException(
        HttpStatus.NOT_FOUND,
        `Cannot delete: user '${id}' never existed in the circus tent.`,
      );
    }

    await this.dbClient.execute(
      'DELETE FROM users WHERE id = $1',
      [id],
    );
  }

  async getByLogin(login: string): Promise<User | null> {
    console.log('🎭 Looking for user by login:', login);
    const row = await this.dbClient.queryOne(
        'SELECT * FROM users WHERE login = $1',
        [login],
    );

    if (!row) {
      console.log(`🤡 No user found for login '${login}'`);
      return null;
    }

    return this.mapDbRowToUser(row as Record<string, unknown>);
  }
}

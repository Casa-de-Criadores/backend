// src/database/postgres/userRepository.ts
import { Injectable } from '@danet/core';
import { DbClient } from '../client.ts';
import { ulid } from 'ulidx';
import { User } from '../../user/models/models.ts';
import { UserRole } from '../../user/constants.ts';

@Injectable()
export class UserRepository {
  constructor(private readonly db: DbClient) {}

  async getAll(): Promise<User[]> {
    const rows = await this.db.query('SELECT * FROM users');
    return rows.map((row: unknown) =>
      this.mapRowToUser(row as Record<string, unknown>)
    );
  }

  async getById(userId: string): Promise<User | undefined> {
    const row = await this.db.queryOne('SELECT * FROM users WHERE id = $1', [
      userId,
    ]);
    return row ? this.mapRowToUser(row as Record<string, unknown>) : undefined;
  }

  async create(
    userData: {
      login: string;
      email: string;
      passwordHash: string;
      role: UserRole;
    },
  ): Promise<User> {
    const id = crypto.randomUUID();
    try {
      const row = await this.db.queryOne(
        `
        INSERT INTO users (
          id,
          login,
          email,
          password_hash,
          role
        ) VALUES ($1, $2, $3, $4, $5::user_role)
        RETURNING *
      `,
        [
          id,
          userData.login,
          userData.email,
          userData.passwordHash,
          userData.role,
        ],
      );
      return this.mapRowToUser(row as Record<string, unknown>);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user');
    }
  }

  async update(
    userId: string,
    userData: Partial<{
      login: string;
      email: string;
      passwordHash: string;
      role: UserRole;
      isDisabled: boolean;
    }>,
  ): Promise<User> {
    const keys = Object.keys(userData);
    if (keys.length === 0) {
      throw new Error('No fields provided to update');
    }
    const setClause = keys.map((key, index) => {
      const column = key === 'passwordHash'
        ? 'password_hash'
        : key === 'isDisabled'
        ? 'is_disabled'
        : key;
      return `"${column}" = $${index + 1}`;
    }).join(', ');
    const values = keys.map((key) => userData[key as keyof typeof userData]);
    values.push(userId);
    const sql = `
      UPDATE users
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;
    const row = await this.db.queryOne(sql, values);
    return this.mapRowToUser(row as Record<string, unknown>);
  }

  async deleteOne(userId: string): Promise<void> {
    await this.db.execute('DELETE FROM users WHERE id = $1', [userId]);
  }

  async deleteAll(): Promise<void> {
    await this.db.execute('DELETE FROM users');
  }

  private mapRowToUser(row: Record<string, unknown>): User {
    return new User({
      id: row.id as string,
      login: row.login as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      role: row.role as UserRole,
      createdAt: row.created_at as string,
      lastLoginAt: row.last_login_at as string,
      isDisabled: row.is_disabled as boolean,
    });
  }
}

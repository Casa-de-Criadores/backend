// src/database/client.ts
import { Injectable } from '@danet/core';
import { Pool, PoolClient, PostgresError } from 'postgres';
import '@std/dotenv';

const DB_CONNECTIONS = 5;

@Injectable()
export class DbClient {
  private pool: Pool;
  private isClosing = false;

  constructor() {
    console.error('🎪 Creating database connection pool...');
    this.pool = new Pool(
      {
        hostname: Deno.env.get('DB_HOST') || 'localhost',
        database: Deno.env.get('DB_NAME') || 'my_database',
        user: Deno.env.get('DB_USERNAME') || 'postgres',
        password: Deno.env.get('DB_PASSWORD') || 'supersecret',
        port: Number(Deno.env.get('DB_PORT') || 5432),
      },
      DB_CONNECTIONS,
      true,
    );
  }

  async closeConnections(): Promise<void> {
    if (this.isClosing) return;

    try {
      console.error('🎪 Initiating database connection closure...');
      this.isClosing = true;

      // Attempt to end the pool
      if (this.pool) {
        await this.pool.end();
      }

      console.error('🎪 Database connections closed!');
    } catch (error) {
      console.error(
        '🤡 Error closing database connections:',
        error instanceof Error ? error.message : error,
      );
    } finally {
      this.isClosing = false;
    }
  }

  // Alias for compatibility
  async end(): Promise<void> {
    await this.closeConnections();
  }

  private async withClient<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      return await operation(client);
    } finally {
      try {
        client.release();
      } catch (error) {
        console.error(
          '🤡 Error releasing client:',
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  async forceCloseConnections(): Promise<void> {
    try {
      console.error('🎪 Forcibly closing all database connections...');

      // Attempt to close pool
      if (this.pool) {
        await this.pool.end();
      }

      console.error('🎪 Forcible connection closure complete!');
    } catch (error) {
      console.error(
        '🤡 Error during forcible connection closure:',
        error instanceof Error ? error.message : error,
      );
    }
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.withClient(async (client) => {
      try {
        console.error('🎭 Executing query:', sql.slice(0, 100) + '...');
        const result = await client.queryObject<T>(sql, params);
        return result.rows;
      } catch (error) {
        // More specific error handling for PostgreSQL errors
        if (error instanceof PostgresError) {
          console.error('🤡 PostgreSQL query error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        } else if (error instanceof Error) {
          console.error('🤡 Database query error:', error.message);
        }

        // Handle specific error scenarios
        if (error instanceof Error) {
          if (error.message.includes('invalid input syntax for type uuid')) {
            return [];
          }
          if (
            error.message.includes('relation') &&
            error.message.includes('does not exist')
          ) {
            throw new Error(
              `Table not found. Did you run migrations? Error: ${error.message}`,
            );
          }
        }
        throw error;
      }
    });
  }

  async queryOne<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | undefined> {
    try {
      console.error('🎭 Executing queryOne:', sql.slice(0, 100) + '...');
      const results = await this.query<T>(sql, params);
      return results[0];
    } catch (error) {
      if (error instanceof PostgresError) {
        console.error('🤡 PostgreSQL queryOne error:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else if (error instanceof Error) {
        console.error('🤡 Database queryOne error:', error.message);
        if (error.message.includes('invalid input syntax for type uuid')) {
          return undefined;
        }
      }
      throw error;
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.withClient(async (client) => {
      try {
        console.error('🎭 Executing statement:', sql.slice(0, 100) + '...');
        await client.queryArray(sql, params);
      } catch (error: unknown) {
        if (error instanceof PostgresError) {
          console.error('🤡 PostgreSQL execute error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        } else {
          console.error('🤡 Database execute error:', error);
        }

        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes('relation') && message.includes('does not exist')
        ) {
          throw new Error(
            `Table not found. Did you run migrations? Error: ${message}`,
          );
        }
        throw new Error(`Failed to execute statement: ${message}`);
      }
    });
  }

  async queryObject<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<{ rows: T[] }> {
    return this.withClient(async (client) => {
      try {
        console.error('🎭 Executing queryObject:', sql.slice(0, 100) + '...');
        return await client.queryObject<T>(sql, params);
      } catch (error: unknown) {
        if (error instanceof PostgresError) {
          console.error('🤡 PostgreSQL queryObject error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        } else {
          console.error('🤡 Database queryObject error:', error);
        }

        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes('relation') && message.includes('does not exist')
        ) {
          throw new Error(
            `Table not found. Did you run migrations? Error: ${message}`,
          );
        }
        throw new Error(`Failed to execute queryObject: ${message}`);
      }
    });
  }
}

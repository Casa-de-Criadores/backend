// src/database/client.ts
import { Injectable } from '@danet/core';
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

const DB_CONNECTIONS = 5;

const pool = new Pool({
    hostname: Deno.env.get('PG_HOST'),
    user: Deno.env.get('PG_USER'),
    password: Deno.env.get('PG_PASS'),
    database: Deno.env.get('PG_DB'),
    port: Number(Deno.env.get('PG_PORT') ?? 5432),
}, DB_CONNECTIONS, true);

@Injectable()
export class DbClient {
    async query(sql: string, params: unknown[] = []): Promise<any[]> {
        const client = await pool.connect();
        try {
            const result = await client.queryObject(sql, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async queryOne(sql: string, params: unknown[] = []): Promise<any | undefined> {
        return (await this.query(sql, params))[0];
    }

    async execute(sql: string, params: unknown[] = []): Promise<void> {
        const client = await pool.connect();
        try {
            await client.queryArray(sql, params);
        } finally {
            client.release();
        }
    }
}

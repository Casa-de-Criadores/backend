import 'https://deno.land/std@0.200.0/dotenv/load.ts';
import {Injectable} from '@danet/core';
import {DbClient} from './client.ts';

@Injectable()
export class MigrationService {
  constructor(private readonly db: DbClient) {}

  async runMigrations(): Promise<void> {
    await this.db.execute(`
            CREATE TABLE IF NOT EXISTS category (
                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
                );
        `);

    await this.db.execute(`
            CREATE TABLE IF NOT EXISTS tags (
                                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
                );
        `);

    await this.db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                price NUMERIC(10,2) NOT NULL,
                currency CHAR(3) NOT NULL,
                category_id UUID REFERENCES category(id),
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
                );
        `);

    await this.db.execute(`
            CREATE TABLE IF NOT EXISTS product_tags (
                                                        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
                tag_id     UUID REFERENCES tags(id)     ON DELETE CASCADE,
                PRIMARY KEY (product_id, tag_id)
                );
        `);

    // ── identity & profiles ──────────────────────────────────
    // 1) user_role enum
    await this.db.execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('admin','brand','customer');
        END IF;
      END$$;
    `);

    // 2) users table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        login TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role user_role NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        last_login_at TIMESTAMPTZ,
        is_disabled BOOLEAN DEFAULT false NOT NULL
      );
    `);

    // 3) brand_profile table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS brand_profile (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        bio TEXT,
        website TEXT,
        logo_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active','pending','inactive'))
      );
    `);

    // 4) customer_profile table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS customer_profile (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        display_name TEXT,
        avatar_url TEXT,
        preferences JSONB,
        language TEXT,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active','pending','inactive'))
      );
    `);
    console.log(
      '🤡 [MigrationService] all tables (products, categories, tags, users, user profiles) ensured',
    );
  }
}

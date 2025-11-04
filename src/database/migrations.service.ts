import 'https://deno.land/std@0.200.0/dotenv/load.ts';
import { Injectable } from '@danet/core';
import { DbClient } from './client.ts';

@Injectable()
export class MigrationService {
  constructor(private readonly db: DbClient) {}

  async runMigrations(): Promise<void> {
    console.log('🎪 Time to raise the GREATEST DATABASE ON EARTH!');

    try {
      // 1. First, our magic tools!
      console.log('🎩 Installing our magic extensions...');
      await this.db.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

      // 2. Set up our user roles (The cast of characters!)
      console.log('🎭 Creating our cast of characters...');
      await this.db.execute(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('admin', 'brand', 'customer', 'super');
          END IF;
        END$$;
      `);

      // 3. Create users table (Our performers!)
      console.log('🤹 Setting up the performers table...');
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          login TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role user_role NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          last_login_at TIMESTAMPTZ,
          is_disabled BOOLEAN DEFAULT false NOT NULL
        );
      `);

      // 4. Create brand_profile table (The ringmasters!)
      console.log('🎪 Creating the brand ringmaster profiles...');
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS brand_profile (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

      // 5. Categories (Our circus acts!)
      console.log('🎪 Setting up the category circus acts...');
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS category (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
      `);

      // 6. Tags (Our circus props!)
      console.log('🏷️ Organizing our circus props...');
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS tags (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
      `);

      // 7. Products (The main attractions!)
      console.log('🎭 Setting up our main attractions...');
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          price NUMERIC(10,2) NOT NULL,
          currency CHAR(3) NOT NULL,
          category_id UUID REFERENCES category(id),
          brand_id UUID NOT NULL REFERENCES brand_profile(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
      `);

      // 8. Product Tags (The show program!)
      console.log('🎫 Creating the product-tags playbill...');
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS product_tags (
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
          PRIMARY KEY (product_id, tag_id)
        );
      `);

      console.log(
        '✨ THE GREATEST DATABASE ON EARTH IS READY! *trumpet sounds* 🎺',
      );
    } catch (error: unknown) {
      console.error('🤡 DISASTER! The circus tent collapsed:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Table not found. Did you run migrations? ${message}`,
      );
    }
  }
}

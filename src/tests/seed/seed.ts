// backend/src/scripts/seed.ts
import { DbClient } from '../../database/client.ts';

const BRAND_USER_ID = "22222222-2222-2222-2222-222222222222";
const BRAND_PROFILE_ID = "44444444-4444-4444-4444-444444444444";
const TEST_CATEGORY_ID = "55555555-5555-5555-5555-555555555555";
const PRODUCT_ID = "66666666-6666-6666-6666-666666666666";

async function seed() {
    const db = new DbClient();

    try {
        // Create user
        await db.query(`
      INSERT INTO users (id, login, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5::user_role)
      ON CONFLICT (id) DO NOTHING
    `, [
            BRAND_USER_ID,
            'testbrand',
            'testbrand@casadecriadores.com.br',
            'hashed_password',
            'brand'
        ]);

        // Create brand_profile (not brands!)
        await db.query(`
      INSERT INTO brand_profile (id, user_id, title, slug, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
            BRAND_PROFILE_ID,
            BRAND_USER_ID,
            'Studio Aurélia',
            'studio-aurelia',
            'active'
        ]);

        // Create category first
        await db.query(`
      INSERT INTO category (id, name, slug)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
    `, [
            TEST_CATEGORY_ID,
            'Vestidos',
            'vestidos'
        ]);

        // Create product (matching your schema: name, slug, etc)
        await db.query(`
      INSERT INTO products (id, brand_id, name, slug, price, currency, description, category_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `, [
            PRODUCT_ID,
            BRAND_PROFILE_ID,
            'Vestido Estrutural Cerrado',
            'vestido-estrutural-cerrado',
            1850.00,
            'BRL',
            'Vestido midi em algodão orgânico com estrutura inspirada na vegetação do cerrado brasileiro.',
            TEST_CATEGORY_ID
        ]);

        console.log('✅ Seed data created');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    } finally {
        await db.end();
    }
}

seed()
    .then(() => {
        console.log('✅ Seeding complete');
        Deno.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        Deno.exit(1);
    });
import { Injectable } from '@danet/core';
import { ulid } from 'ulidx';
import { Product } from '../../product/models/models.ts';
import { ProductImage } from '../../product/class.ts';
import { Repository } from '../repository.ts';
import { DbClient } from '../client.ts';

@Injectable()
export class ProductRepository implements Repository<Product> {
  constructor(private readonly db: DbClient) {}

  async getAll(): Promise<Product[]> {
    const rows = await this.db.query(`SELECT * FROM products`);
    return rows.map((row: unknown) =>
      this.mapRowToProduct(row as Record<string, unknown>)
    );
  }

  async getById(id: string): Promise<Product | undefined> {
    const row = await this.db.queryOne(`SELECT * FROM products WHERE id = $1`, [
      id,
    ]);
    return row
      ? this.mapRowToProduct(row as Record<string, unknown>)
      : undefined;
  }

  async create(dto: unknown): Promise<Product> {
    const raw = dto as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
    const id = crypto.randomUUID();
    console.log('🎭 Generated product ID:', id); // Log to verify
    const slug = raw.title.toLowerCase().replace(/\s+/g, '-');

    try {
      const row = await this.db.queryOne(
        `INSERT INTO products (
          id, name, slug, description, price, currency, category_id, brand_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, now()
        ) RETURNING *`,
        [
          id,
          raw.title,
          slug,
          raw.description,
          raw.price,
          raw.currency || 'USD',
          raw.categoryId,
          raw.brandId,
        ],
      );
      return this.mapRowToProduct(row as Record<string, unknown>);
    } catch (error) {
      console.error('🤡 Product creation error:', error);
      throw error;
    }
  }

  async updateOne(id: string, dto: Product): Promise<Product> {
    const slug = dto.title.toLowerCase().replace(/\s+/g, '-');

    try {
      const row = await this.db.queryOne(
        `UPDATE products SET
          name = $1,
          slug = $2,
          description = $3,
          price = $4,
          currency = $5,
          category_id = $6,
          brand_id = $7,
          updated_at = now()
        WHERE id = $8
        RETURNING *`,
        [
          dto.title,
          slug,
          dto.description,
          dto.price,
          dto.currency || 'USD',
          dto.categoryId,
          dto.brandId,
          id,
        ],
      );
      return this.mapRowToProduct(row as Record<string, unknown>);
    } catch (error) {
      console.error('🤡 Update product error:', error);
      throw error;
    }
  }

  async deleteOne(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM products WHERE id = $1`, [id]);
  }

  async deleteAll(): Promise<void> {
    await this.db.execute(`DELETE FROM products`);
  }

  private mapRowToProduct(row: Record<string, unknown>): Product {
    // Add safeguards for JSON parsing
    let images = [];
    try {
      // Only parse if images exists and is a string
      if (row.images && typeof row.images === 'string') {
        images = JSON.parse(row.images as string);
      }
    } catch (error) {
      console.error('🤡 Failed to parse images JSON:', error);
    }

    // Default empty array for tagIds if undefined
    const tagIds = row.tag_ids || [];

    return {
      id: row.id as string,
      title: row.name as string,
      description: row.description as string,
      price: Number(row.price),
      currency: (row.currency as string) || 'USD',
      categoryId: row.category_id as string,
      createdAt: new Date(row.created_at as string).toISOString(),
      updatedAt: row.updated_at
        ? new Date(row.updated_at as string).toISOString()
        : undefined,
      brandId: row.brand_id as string,
      mainImage: (row.main_image as string) || '',
      images: images as ProductImage[],
      tagIds: tagIds as string[],
      inventory: row.inventory ? Number(row.inventory) : null,
      isAvailable: row.is_available ? Boolean(row.is_available) : true,
    };
  }
}

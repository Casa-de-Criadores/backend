import { Injectable } from '@danet/core';
import { ProductCategory } from '../../product/class.ts';
import { DbClient } from '../client.ts';
import { Repository } from '../repository.ts';

@Injectable()
export class CategoryRepository implements Repository<ProductCategory> {
  constructor(private readonly db: DbClient) {}

  async getAll(): Promise<ProductCategory[]> {
    const rows = await this.db.query('SELECT * FROM category');
    return rows.map((row) =>
      this.mapRowToCategory(row as Record<string, unknown>)
    );
  }

  async getById(id: string): Promise<ProductCategory | undefined> {
    const row = await this.db.queryOne(
      'SELECT * FROM category WHERE id = $1',
      [id],
    );
    return row
      ? this.mapRowToCategory(row as Record<string, unknown>)
      : undefined;
  }

  async create(dto: unknown): Promise<ProductCategory> {
    const { name, slug, description } = dto as {
      name: string;
      slug: string;
      description?: string;
    };
    const row = await this.db.queryOne(
      `INSERT INTO category (name, slug, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, slug, description],
    );
    return this.mapRowToCategory(row as Record<string, unknown>);
  }

  async updateOne(id: string, dto: ProductCategory): Promise<ProductCategory> {
    const row = await this.db.queryOne(
      `UPDATE category
       SET name = $1, slug = $2, description = $3, updated_at = now()
       WHERE id = $4 RETURNING *`,
      [dto.name, dto.slug, id],
    );
    return this.mapRowToCategory(row as Record<string, unknown>);
  }

  async deleteOne(id: string): Promise<ProductCategory> {
    const row = await this.db.queryOne(
      'DELETE FROM category WHERE id = $1 RETURNING *',
      [id],
    );
    return this.mapRowToCategory(row as Record<string, unknown>);
  }

  async deleteAll(): Promise<void> {
    await this.db.query('TRUNCATE category RESTART IDENTITY CASCADE');
  }

  private mapRowToCategory(row: Record<string, unknown>): ProductCategory {
    return new ProductCategory({
      id: row.id as string,
      name: { en: row.name as string },
      slug: { en: row.slug as string },
      icon: row.icon as string | undefined,
      order: row.order as number | undefined,
    });
  }
}

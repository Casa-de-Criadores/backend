import { Injectable } from '@danet/core';
import { Repository } from '../repository.ts';
import { DbClient } from '../client.ts';
import { ProductTag } from '../../product/class.ts';

@Injectable()
export class TagRepository implements Repository<ProductTag> {
  constructor(private readonly db: DbClient) {}

  // 1. Fetch all tags
  async getAll(): Promise<ProductTag[]> {
    const raws = await this.db.query('SELECT * FROM tags');
    return raws.map((raw) => this.mapRowToTag(raw as Record<string, unknown>));
  }

  // 2. Fetch one tag by its ID
  async getById(id: string): Promise<ProductTag | undefined> {
    const raw = await this.db.queryOne(
      'SELECT * FROM tags WHERE id = $1',
      [id],
    );
    return raw ? this.mapRowToTag(raw as Record<string, unknown>) : undefined;
  }

  // 3. Your special "multiple fetch" helper
  async getByIds(ids: string[]): Promise<ProductTag[]> {
    const raws = await this.db.query(
      'SELECT * FROM tags WHERE id = ANY($1)',
      [ids],
    );
    return raws.map((raw) => this.mapRowToTag(raw as Record<string, unknown>));
  }

  // 4. Create a new tag
  async create(dto: unknown): Promise<ProductTag> {
    const { name, color, description, slug } = dto as {
      name: string;
      color?: string;
      description?: string;
      slug: string;
    };
    const raw = await this.db.queryOne(
      `INSERT INTO tags (name, color, description, slug)
             VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, color, description, slug],
    );
    return this.mapRowToTag(raw as Record<string, unknown>);
  }

  // 5. Update an existing tag
  async updateOne(id: string, dto: ProductTag): Promise<ProductTag> {
    const raw = await this.db.queryOne(
      `UPDATE tags
             SET name = $1, color = $2, description = $3, slug = $4, updated_at = now()
             WHERE id = $5
             RETURNING *`,
      [dto.name, dto.color, dto.description, dto.slug, id],
    );
    return this.mapRowToTag(raw as Record<string, unknown>);
  }

  // 6. Delete a single tag
  async deleteOne(id: string): Promise<ProductTag> {
    const raw = await this.db.queryOne(
      'DELETE FROM tags WHERE id = $1 RETURNING *',
      [id],
    );
    return this.mapRowToTag(raw as Record<string, unknown>);
  }

  // 7. Nukes all tags—handle with care!
  async deleteAll(): Promise<void> {
    await this.db.query('TRUNCATE tags RESTART IDENTITY CASCADE');
  }

  private mapRowToTag(row: Record<string, unknown>): ProductTag {
    return new ProductTag({
      id: row.id as string,
      name: { en: row.name as string },
      color: row.color as string | undefined,
      description: row.description
        ? { en: row.description as string }
        : undefined,
      slug: { en: row.slug as string },
    });
  }
}

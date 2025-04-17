import { Injectable } from '@danet/core';
import { Repository } from '../repository.ts';
import { DbClient } from '../client.ts';
import { ProductTag } from '../../product/class.ts';

@Injectable()
export class TagRepository implements Repository<ProductTag> {
    constructor(private readonly db: DbClient) {}

    // 1. Fetch all tags
    async getAll(): Promise<ProductTag[]> {
        const raws = await this.db.query("SELECT * FROM tags");
        return raws.map((raw: any) => new ProductTag(raw));
    }

    // 2. Fetch one tag by its ID
    async getById(id: string): Promise<ProductTag | undefined> {
        const raw = await this.db.queryOne(
            "SELECT * FROM tags WHERE id = $1",
            [id],
        );
        return raw ? new ProductTag(raw) : undefined;
    }

    // 3. Your special “multiple fetch” helper
    async getByIds(ids: string[]): Promise<ProductTag[]> {
        const raws = await this.db.query(
            "SELECT * FROM tags WHERE id = ANY($1)",
            [ids],
        );
        return raws.map((raw: any) => new ProductTag(raw));
    }

    // 4. Create a new tag
    async create(dto: unknown): Promise<any> {
        const { name, slug } = dto as { name: string; slug: string };
        const raw = await this.db.queryOne(
            `INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING *`,
            [name, slug],
        );
        return new ProductTag(raw);
    }

    // 5. Update an existing tag
    async updateOne(id: string, dto: ProductTag): Promise<unknown> {
        const raw = await this.db.queryOne(
            `UPDATE tags
         SET name = $1, slug = $2, updated_at = now()
       WHERE id = $3
       RETURNING *`,
            [dto.name, dto.slug, id],
        );
        return new ProductTag(raw);
    }

    // 6. Delete a single tag
    async deleteOne(id: string): Promise<unknown> {
        const raw = await this.db.queryOne(
            "DELETE FROM tags WHERE id = $1 RETURNING *",
            [id],
        );
        return new ProductTag(raw);
    }

    // 7. Nukes all tags—handle with care!
    async deleteAll(): Promise<unknown> {
        await this.db.query("TRUNCATE tags RESTART IDENTITY CASCADE");
        return;
    }
}

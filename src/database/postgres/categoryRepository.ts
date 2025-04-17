import { Injectable } from '@danet/core';
import {ProductCategory} from "../../product/class.ts";
import {DbClient} from "../client.ts";
import {Repository} from "../repository.ts";

@Injectable()
export class CategoryRepository implements Repository<ProductCategory> {
    constructor(private readonly db: DbClient) {}

    async getAll(): Promise<ProductCategory[]> {
        const raws = await this.db.query("SELECT * FROM categories");
        return raws.map(raw => new ProductCategory(raw));
    }

    async getById(id: string): Promise<ProductCategory | undefined> {
        const raw = await this.db.queryOne(
            "SELECT * FROM categories WHERE id = $1",
            [id],
        );
        return raw ? new ProductCategory(raw) : undefined;
    }

    async create(dto: unknown): Promise<any> {
        const { name, slug, description } = dto as {
            name: string;
            slug: string;
            description?: string;
        };
        const raw = await this.db.queryOne(
            `INSERT INTO categories (name, slug, description)
       VALUES ($1, $2, $3) RETURNING *`,
            [name, slug, description],
        );
        return new ProductCategory(raw);
    }

    async updateOne(id: string, dto: ProductCategory): Promise<unknown> {
        const raw = await this.db.queryOne(
            `UPDATE categories
       SET name = $1, slug = $2, description = $3, updated_at = now()
       WHERE id = $4 RETURNING *`,
            [dto.name, dto.slug, id],
        );
        return new ProductCategory(raw);
    }

    async deleteOne(id: string): Promise<unknown> {
        const raw = await this.db.queryOne(
            "DELETE FROM categories WHERE id = $1 RETURNING *",
            [id],
        );
        return new ProductCategory(raw);
    }

    async deleteAll(): Promise<unknown> {
        // be careful in production!
        await this.db.query("TRUNCATE categories RESTART IDENTITY CASCADE");
        return;
    }
}
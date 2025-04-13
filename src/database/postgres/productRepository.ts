import { Injectable } from '@danet/core';
import { ulid } from 'ulidx';
import { Product } from '../../product/models/models.ts';
import { Repository } from '../repository.ts';
import { DbClient } from '../client.ts';

@Injectable()
export class ProductRepository implements Repository<Product> {
    constructor(private readonly db: DbClient) {}

    async getAll(): Promise<Product[]> {
        const rows = await this.db.query(`SELECT * FROM products`);
        return rows.map(this.mapRowToProduct);
    }

    async getById(id: string): Promise<Product | undefined> {
        const row = await this.db.queryOne(`SELECT * FROM products WHERE id = $1`, [id]);
        return row ? this.mapRowToProduct(row) : undefined;
    }

    async create(dto: unknown): Promise<Product> {
        // Assume dto has already been validated via DTO/Zod pipeline
        const raw = dto as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
        const id = ulid();
        const createdAt = new Date().toISOString();

        await this.db.execute(
            `INSERT INTO products (
        id, brand_id, title, price, description, main_image, images,
        category_id, tag_ids, created_at, inventory, is_available
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb,
        $8, $9::text[], $10, $11, $12
      )`,
            [
                id,
                raw.brandId,
                raw.title,
                raw.price,
                raw.description,
                raw.mainImage,
                JSON.stringify(raw.images),
                raw.categoryId,
                raw.tagIds,
                createdAt,
                raw.inventory ?? null,
                raw.isAvailable ?? true,
            ]
        );

        return {
            ...raw,
            id,
            createdAt,
            updatedAt: undefined,
        };
    }

    async updateOne(id: string, dto: Product): Promise<Product> {
        const updatedAt = new Date().toISOString();

        await this.db.execute(
            `UPDATE products SET
        brand_id = $1,
        title = $2,
        price = $3,
        description = $4,
        main_image = $5,
        images = $6::jsonb,
        category_id = $7,
        tag_ids = $8::text[],
        inventory = $9,
        is_available = $10,
        updated_at = $11
      WHERE id = $12`,
            [
                dto.brandId,
                dto.title,
                dto.price,
                dto.description,
                dto.mainImage,
                JSON.stringify(dto.images),
                dto.categoryId,
                dto.tagIds,
                dto.inventory ?? null,
                dto.isAvailable ?? true,
                updatedAt,
                id,
            ]
        );

        return {
            ...dto,
            updatedAt,
        };
    }

    async deleteOne(id: string): Promise<void> {
        await this.db.execute(`DELETE FROM products WHERE id = $1`, [id]);
    }

    async deleteAll(): Promise<void> {
        await this.db.execute(`DELETE FROM products`);
    }

    private mapRowToProduct(row: Record<string, unknown>): Product {
        return {
            id: row.id as string,
            brandId: row.brand_id as string,
            title: row.title as string,
            price: Number(row.price),
            description: row.description as string,
            mainImage: row.main_image as string,
            images: JSON.parse(row.images as string),
            categoryId: row.category_id as string,
            tagIds: row.tag_ids as string[],
            createdAt: new Date(row.created_at as string).toISOString(),
            inventory: row.inventory === null ? null : Number(row.inventory),
            isAvailable: row.is_available as boolean,
            updatedAt: row.updated_at ? new Date(row.updated_at as string).toISOString() : undefined,
        };
    }
}

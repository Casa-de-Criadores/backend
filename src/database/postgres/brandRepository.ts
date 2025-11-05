import { Injectable } from '@danet/core';
import { DbClient } from '../client.ts';
import { Brand, BrandModel } from '../../brand/models/models.ts';

@Injectable()
export class BrandRepository {
  constructor(private readonly dbClient: DbClient) {}

  async getAll(): Promise<Brand[]> {
    const result = await this.dbClient.query(
      `SELECT * FROM brand_profile ORDER BY created_at DESC`,
    );
    return result.map(this.mapRowToBrand);
  }

  async getById(id: string): Promise<Brand | null> {
    const result = await this.dbClient.queryOne(
      `SELECT * FROM brand_profile WHERE id = $1`,
      [id],
    );
    return result ? this.mapRowToBrand(result) : null;
  }

  async getByUserId(userId: string): Promise<Brand | null> {
    const result = await this.dbClient.queryOne(
      `SELECT * FROM brand_profile WHERE user_id = $1`,
      [userId],
    );
    return result ? this.mapRowToBrand(result) : null;
  }

  async getBySlug(slug: string): Promise<Brand | null> {
    const result = await this.dbClient.queryOne(
      `SELECT * FROM brand_profile WHERE slug = $1`,
      [slug],
    );
    return result ? this.mapRowToBrand(result) : null;
  }

  async create(brand: Brand): Promise<Brand> {
    const result = await this.dbClient.queryOne(
      `
      INSERT INTO brand_profile (
        id, user_id, title, slug, description,
        logo_url, banner_url, contact_email, website_url,
        status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12
      ) RETURNING *
      `,
      [
        brand.id,
        brand.userId,
        brand.title,
        brand.slug,
        brand.description,
        brand.logoUrl,
        brand.bannerUrl,
        brand.contactEmail,
        brand.websiteUrl,
        brand.status,
        brand.createdAt,
        brand.updatedAt,
      ],
    );
    return this.mapRowToBrand(result);
  }

  async update(id: string, brand: Brand): Promise<Brand> {
    const result = await this.dbClient.queryOne(
      `
      UPDATE brand_profile SET
        title = $1,
        slug = $2,
        description = $3,
        logo_url = $4,
        banner_url = $5,
        contact_email = $6,
        website_url = $7,
        status = $8,
        updated_at = $9
      WHERE id = $10
      RETURNING *
      `,
      [
        brand.title,
        brand.slug,
        brand.description,
        brand.logoUrl,
        brand.bannerUrl,
        brand.contactEmail,
        brand.websiteUrl,
        brand.status,
        brand.updatedAt,
        id,
      ],
    );
    return this.mapRowToBrand(result);
  }

  async delete(id: string): Promise<Brand> {
    const result = await this.dbClient.queryOne(
      `DELETE FROM brand_profile WHERE id = $1 RETURNING *`,
      [id],
    );
    return this.mapRowToBrand(result);
  }

  private mapRowToBrand(row: any): Brand {
    return new BrandModel({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      logoUrl: row.logo_url,
      bannerUrl: row.banner_url,
      contactEmail: row.contact_email,
      websiteUrl: row.website_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

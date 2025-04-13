import { z } from "zod";

export class ProductCategory {
  id: string;
  name: Record<string, string>;
  icon?: string;
  order?: number;

  constructor({ id, name, icon, order }: ProductCategory) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.order = order;
  }
}

export class ProductTag {
  id: string;
  name: Record<string, string>;
  color?: string;
  description?: Record<string, string>;

  constructor({ id, name, color, description }: ProductTag) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.description = description;
  }
}

export class ProductImage {
  url: string;
  alt?: string;
  priority?: number;

  constructor({ url, alt, priority }: ProductImage) {
    this.url = url;
    this.alt = alt;
    this.priority = priority;
  }
}

export const ProductImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  priority: z.number().int().optional(),
});

export const ProductCategorySchema = z.object({
  id: z.string(),
  name: z.record(z.string()),
  icon: z.string().optional(),
  order: z.number().int().optional(),
});

export const ProductTagSchema = z.object({
  id: z.string(),
  name: z.record(z.string()),
  color: z.string().optional(),
  description: z.record(z.string()).optional(),
});

export const ProductSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  description: z.string().min(1),
  mainImage: z.string().url(),
  images: z.array(ProductImageSchema),
  categoryId: z.string(),
  tagIds: z.array(z.string()),
  createdAt: z.string().datetime(),
  inventory: z.number().int().nonnegative().nullable().optional(),
  isAvailable: z.boolean().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
export type ProductImageInput = z.infer<typeof ProductImageSchema>;
export type ProductCategoryInput = z.infer<typeof ProductCategorySchema>;
export type ProductTagInput = z.infer<typeof ProductTagSchema>;


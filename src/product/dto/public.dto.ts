import {z} from 'zod';
import {ProductImage, ProductImageInput, ProductImageSchema,} from '../class.ts';
import {Product, ProductWithDetails} from '../models/models.ts';
import {CustomException, getZodMessage, HttpStatus,} from '../../utils.ts';
import {ulid} from 'ulidx';

// === Zod Schemas ===

export const CreateProductSchema = z.object({
  brandId: z.string(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  description: z.string().min(1),
  mainImage: z.string().url(),
  images: z.array(ProductImageSchema),
  categoryId: z.string(),
  tagIds: z.array(z.string()),
  inventory: z.number().int().nonnegative().nullable().optional(),
  isAvailable: z.boolean().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// === CreateProductDto ===

export class CreateProductDto {
    private readonly data: CreateProductInput;

    constructor(data: CreateProductInput) {
        this.data = data;
    }

    static validate(raw: unknown): CreateProductInput {
        const result = CreateProductSchema.safeParse(raw);
        if (!result.success) {
            throw new CustomException(getZodMessage(result.error), HttpStatus.BAD_REQUEST);
        }
        return result.data;
    }

    static from(raw: unknown): CreateProductDto {
        const data = this.validate(raw);
        return new CreateProductDto(data);
    }

    toProduct(): Product {
        return new Product({
            ...this.data,
            id: ulid(),
            createdAt: new Date().toISOString(),
            inventory: this.data.inventory ?? null,
            isAvailable: this.data.isAvailable ?? true,
        });
    }
}

// === UpdateProductDto ===

export class UpdateProductDto {
    private readonly data: UpdateProductInput;

    constructor(data: UpdateProductInput) {
        this.data = data;
    }

    static validate(raw: unknown): UpdateProductInput {
        const result = UpdateProductSchema.safeParse(raw);
        if (!result.success) {
            throw new CustomException(getZodMessage(result.error), HttpStatus.BAD_REQUEST);
        }
        return result.data;
    }

    static from(raw: unknown): UpdateProductDto {
        const data = this.validate(raw);
        return new UpdateProductDto(data);
    }

    mergeInto(product: Product): Product {
        return new Product({
            id: product.id,
            brandId: this.data.brandId ?? product.brandId,
            title: this.data.title ?? product.title,
            price: this.data.price ?? product.price,
            description: this.data.description ?? product.description,
            mainImage: this.data.mainImage ?? product.mainImage,
            images: this.data.images ?? product.images,
            categoryId: this.data.categoryId ?? product.categoryId,
            tagIds: this.data.tagIds ?? product.tagIds,
            createdAt: product.createdAt,
            updatedAt: new Date().toISOString(),
            inventory: this.data.inventory ?? product.inventory ?? null,
            isAvailable: this.data.isAvailable ?? product.isAvailable ?? true,
        });
    }
}

// === ProductResponseDto ===

export class ProductResponseDto {
    constructor(
        public readonly id: string,
        public readonly brandId: string,
        public readonly title: string,
        public readonly price: number,
        public readonly description: string,
        public readonly mainImage: string,
        public readonly images: ProductImage[],
        public readonly categoryId: string,
        public readonly tagIds: string[],
        public readonly createdAt: string,
        public readonly inventory: number | null,
        public readonly isAvailable: boolean,
        public readonly updatedAt?: string
    ) {}

    static from(product: Product): ProductResponseDto {
        return new ProductResponseDto(
            product.id,
            product.brandId,
            product.title,
            product.price,
            product.description,
            product.mainImage,
            product.images,
            product.categoryId,
            product.tagIds,
            product.createdAt,
            product.inventory ?? null,
            product.isAvailable ?? true,
            product.updatedAt
        );
    }
}

// === ProductWithDetailsDto ===

export class ProductWithDetailsDto {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly title: string,
    public readonly price: number,
    public readonly description: string,
    public readonly mainImage: string,
    public readonly images: ProductImage[],
    public readonly category: {
      id: string;
      name: Record<string, string>;
      icon?: string;
      order?: number;
    },
    public readonly tags: Array<{
      id: string;
      name: Record<string, string>;
      color?: string;
      description?: Record<string, string>;
    }>,
    public readonly createdAt: string,
    public readonly inventory: number | null,
    public readonly isAvailable: boolean,
    public readonly updatedAt?: string,
  ) {}

  static from(product: ProductWithDetails): ProductWithDetailsDto {
    return new ProductWithDetailsDto(
      product.id,
      product.brandId,
      product.title,
      product.price,
      product.description,
      product.mainImage,
      product.images,
      product.category, // assuming these are already plain objects
      product.tags,
      product.createdAt,
      product.inventory ?? null,
      product.isAvailable ?? true,
      product.updatedAt,
    );
  }
}

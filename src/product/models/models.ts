import { ProductCategory, ProductImage, ProductTag } from '../class.ts';

// models/product.ts

export class Product {
  public id: string;
  public brandId: string;
  public title: string;
  public price: number;
  public currency: string;
  public description: string;
  public mainImage: string;
  public images: ProductImage[];
  public categoryId: string;
  public tagIds: string[];
  public createdAt: string;
  public updatedAt?: string;
  public inventory?: number | null;
  public isAvailable?: boolean;

  constructor(params: {
    id: string;
    brandId: string;
    title: string;
    price: number;
    currency: string;
    description: string;
    mainImage: string;
    images: ProductImage[];
    categoryId: string;
    tagIds: string[];
    createdAt: string;
    updatedAt?: string;
    inventory?: number | null;
    isAvailable?: boolean;
  }) {
    this.id = params.id;
    this.brandId = params.brandId;
    this.title = params.title;
    this.price = params.price;
    this.currency = params.currency;
    this.description = params.description;
    this.mainImage = params.mainImage;
    this.images = params.images;
    this.categoryId = params.categoryId;
    this.tagIds = params.tagIds;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.inventory = params.inventory;
    this.isAvailable = params.isAvailable;
  }
}

export class ProductWithDetails extends Product {
  public category: ProductCategory;
  public tags: ProductTag[];

  constructor(
    product: Product,
    category: ProductCategory,
    tags: ProductTag[],
  ) {
    super({
      id: product.id,
      brandId: product.brandId,
      title: product.title,
      price: product.price,
      currency: product.currency,
      description: product.description,
      mainImage: product.mainImage,
      images: product.images,
      categoryId: product.categoryId,
      tagIds: product.tagIds,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      inventory: product.inventory,
      isAvailable: product.isAvailable,
    });

    this.category = category;
    this.tags = tags;
  }
}

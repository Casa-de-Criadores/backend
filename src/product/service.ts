import {  Injectable } from '@danet/core';
import {Product, ProductWithDetails} from './models/models.ts';
import { CustomException, HttpStatus } from '../utils.ts';
import {ProductRepository} from "../database/postgres/productRepository.ts";
import {TagRepository} from "../database/postgres/tagRepository.ts";
import {CategoryRepository} from "../database/postgres/categoryRepository.ts";
import {ProductWithDetailsDto} from "./dto/public.dto.ts";

@Injectable()
export class ProductService {
  constructor(
      private readonly productRepository: ProductRepository,
      private readonly categoryRepository: CategoryRepository,
      private readonly tagRepository: TagRepository,
  ) {}

  async getAll(): Promise<Product[]> {
    return await this.productRepository.getAll();
  }

  async getById(id: string): Promise<Product> {
    const product = await this.productRepository.getById(id);
    if (!product) {
      throw new CustomException('Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    return this.productRepository.create(product);
  }

  async update(id: string, product: Product): Promise<Product> {
    const existing = this.productRepository.getById(id);
    if (!existing) {
      throw new CustomException('Cannot update non-existent product', HttpStatus.NOT_FOUND);
    }
    return this.productRepository.updateOne(id, product);
  }

  async delete(id: string): Promise<Product> {
    const product = await this.productRepository.getById(id);
    if (!product) {
      throw new CustomException('Cannot delete non-existent product', HttpStatus.NOT_FOUND);
    }
    await this.productRepository.deleteOne(id);
    return product;
  }

  async deleteAll(): Promise<void> {
    await this.productRepository.deleteAll();
  }

  async getProductWithDetails(productId: string): Promise<ProductWithDetailsDto> {
    // Retrieve the basic product object.
    const product = await this.productRepository.getById(productId);
    if (!product) {
      throw new CustomException('Product not found', HttpStatus.NOT_FOUND);
    }

    // Hydrate category and tags.
    const category = await this.categoryRepository.getById(product.categoryId);
    const tags = await this.tagRepository.getByIds(product.tagIds);

    // Create the enriched domain model.
    const productWithDetails = new ProductWithDetails(product, category, tags);

    // Transform the enriched model into its DTO for presentation.
    return ProductWithDetailsDto.from(productWithDetails);
  }
}

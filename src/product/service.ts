import {  Injectable } from '@danet/core';
import {Product, ProductWithDetails} from './models/models.ts';
import { CustomException, HttpStatus } from '../shared/exception.filter.ts';
import {ProductRepository} from "../database/postgres/productRepository.ts";
import {TagRepository} from "../database/postgres/tagRepository.ts";
import {CategoryRepository} from "../database/postgres/categoryRepository.ts";

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
      throw new CustomException(HttpStatus.NOT_FOUND, 'Product not found', );
    }
    return product;
  }

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    return this.productRepository.create(product);
  }

  async update(id: string, product: Product): Promise<Product> {
    const existing = this.productRepository.getById(id);
    if (!existing) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'Cannot update non-existent product' );
    }
    return this.productRepository.updateOne(id, product);
  }

  async delete(id: string): Promise<Product> {
    const product = await this.productRepository.getById(id);
    if (!product) {
      throw new CustomException(HttpStatus.NOT_FOUND, 'Cannot delete non-existent product');
    }
    await this.productRepository.deleteOne(id);
    return product;
  }

  async deleteAll(): Promise<void> {
    await this.productRepository.deleteAll();
  }

  async getProductWithDetails(id: string): Promise<ProductWithDetails> {
    const product = await this.getById(id);

    const category = await this.categoryRepository.getById(product.categoryId);
    if (!category) {
      throw new CustomException(
          HttpStatus.NOT_FOUND,
          `Category ${product.categoryId} for product ${id} not found`
      );
    }

    const tags = await this.tagRepository.getByIds(product.tagIds || []);
    // now TS knows `cat` is definitely a ProductCategory
    return new ProductWithDetails(product, category, tags);
  }
}

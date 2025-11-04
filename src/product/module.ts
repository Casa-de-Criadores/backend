import { Module } from '@danet/core';
import { ProductRepository } from '../database/postgres/productRepository.ts';
import { ProductController } from './controller.ts';
import { ProductService } from './service.ts';
import { DatabaseModule } from '../database/module.ts';
import { BrandModule } from '../brand/module.ts';

@Module({
  controllers: [ProductController],
  injectables: [ProductRepository, ProductService],
  imports: [DatabaseModule, BrandModule],
})
export class ProductModule {}

import { Module } from '@danet/core';
import { DbClient } from './client.ts';
import { ProductRepository } from './postgres/productRepository.ts';
import { CategoryRepository } from './postgres/categoryRepository.ts';
import { TagRepository } from './postgres/tagRepository.ts';
import { MigrationService } from './migrations.service.ts';
import { UserRepository } from './postgres/userRepository.ts';
import { BrandRepository } from './postgres/brandRepository.ts';

@Module({
  injectables: [
    DbClient,
    MigrationService,
    ProductRepository,
    CategoryRepository,
    TagRepository,
    UserRepository,
    BrandRepository,
  ],
})
export class DatabaseModule {}

import {Module} from '@danet/core';
import {DbClient} from './client.ts';
import {ProductRepository} from './postgres/productRepository.ts';
import {CategoryRepository} from './postgres/categoryRepository.ts';
import {TagRepository} from './postgres/tagRepository.ts';
import {MigrationService} from './migrations.service.ts';

@Module({
  injectables: [
    DbClient,
    MigrationService,
    ProductRepository,
    CategoryRepository,
    TagRepository,
  ],
})
export class DatabaseModule {}

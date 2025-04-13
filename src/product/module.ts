import { Module } from '@danet/core'
import { PostgresProductRepository } from '../database/postgres/productRepository.ts';
import { ProductController} from "./controller.ts";
import { ProductService } from "./service.ts";
import { DatabaseModule } from "../database/module.ts";

@Module({
  controllers: [ProductController],
  injectables: [PostgresProductRepository, ProductService],
  imports: [DatabaseModule],
})
export class ProductModule {}

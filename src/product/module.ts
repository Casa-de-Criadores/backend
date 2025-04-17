import { Module } from '@danet/core'
import { ProductRepository } from '../database/postgres/productRepository.ts';
import { ProductController} from "./controller.ts";
import { ProductService } from "./service.ts";
import { DatabaseModule } from "../database/module.ts";

@Module({
  controllers: [ProductController],
  injectables: [ProductRepository, ProductService],
  imports: [DatabaseModule],
})
export class ProductModule {}

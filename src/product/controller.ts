import {Body, Controller, Delete, Get, Param, Post, Put, UseGuard} from '@danet/core';
import {ReturnedType} from '@danet/swagger/decorators';
import {Roles} from '../shared/decorators/roles.decorator.ts';
import {RoleGuard} from '../shared/guards/roles.guard.ts';
import {ProductService} from './service.ts';
import {
    CreateProductDto,
    CreateProductSchema,
    ProductResponseDto,
    ProductWithDetailsDto,
    UpdateProductDto,
    UpdateProductSchema,
} from './dto/public.dto.ts';
import {CustomException, getZodMessage, HttpStatus} from "../shared/exception.filter.ts";

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Basic route: list all products (each mapped to a simple response DTO)
  @Get()
  @ReturnedType(ProductResponseDto, true)
  async getAll(): Promise<ProductResponseDto[]> {
    const products = await this.productService.getAll();
    return products.map(ProductResponseDto.from);
  }

  // Basic route: get a single product (as a simple response DTO)
  @Get(':id')
  @ReturnedType(ProductResponseDto)
  async getById(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productService.getById(id);
    return ProductResponseDto.from(product);
  }

  // Enriched route: get a product with full category and tag details
  @Get(':id/details')
  @ReturnedType(ProductWithDetailsDto)
  async getDetails(@Param('id') id: string): Promise<ProductWithDetailsDto> {
    const domain = await this.productService.getProductWithDetails(id);
    return ProductWithDetailsDto.from(domain);
  }

  // Route to create a product: validates incoming data via Zod + DTO logic
  @Post()
  @Roles('admin', 'brand')
  @UseGuard(RoleGuard)
  @ReturnedType(ProductResponseDto)
  async create(@Body() raw: unknown): Promise<ProductResponseDto> {
    const result = CreateProductSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        getZodMessage(result.error),
      );
    }
    // result.data is of type CreateProductInput
    const dto = CreateProductDto.from(raw);
    const product = dto.toProduct();
    const created = await this.productService.create(product);
    return ProductResponseDto.from(created);
  }

  // Route to update a product: validates update data and merges with the existing product
  @Put(':id')
  @Roles('admin', 'brand')
  @UseGuard(RoleGuard)
  @ReturnedType(ProductResponseDto)
  async update(
    @Param('id') id: string,
    @Body() raw: unknown,
  ): Promise<ProductResponseDto> {
    const result = UpdateProductSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        getZodMessage(result.error),
      );
    }
    // result.data is of type UpdateProductInput
    const dto = result.data;
    const existing = await this.productService.getById(id);
    // Use the UpdateProductDto helper to merge the update with the existing product data
    const merged = UpdateProductDto.from(dto).mergeInto(existing);
    const updated = await this.productService.update(id, merged);
    return ProductResponseDto.from(updated);
  }

  // Route to delete a product: returns the deleted product as a response DTO
  @Delete(':id')
  @Roles('admin', 'brand')
  @UseGuard(RoleGuard)
  @ReturnedType(ProductResponseDto)
  async delete(@Param('id') id: string): Promise<ProductResponseDto> {
    const deleted = await this.productService.delete(id);
    return ProductResponseDto.from(deleted);
  }
}

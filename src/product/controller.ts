import {
  Body,
  Context,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuard,
  HttpCode
} from '@danet/core';
import type { HttpContext } from '@danet/core';
import { ReturnedType } from '@danet/swagger/decorators';
import { Roles } from '../shared/decorators/roles.decorator.ts';
import { RoleGuard } from '../shared/guards/roles.guard.ts';
import { ProductService } from './service.ts';
import {
  CreateProductDto,
  CreateProductSchema,
  ProductResponseDto,
  ProductWithDetailsDto,
  UpdateProductDto,
  UpdateProductSchema,
} from './dto/public.dto.ts';
import {
  CustomException,
  getZodMessage,
  HttpStatus,
} from '../shared/exception.filter.ts';
import { IdParamSchema } from './dto/params.dto.ts';
import { BrandService } from '../brand/service.ts';
import { DbClient } from '../database/client.ts';

@Controller('product')
export class ProductController {
  constructor(
      private readonly productService: ProductService,
      private readonly brandService: BrandService,
      private readonly dbClient: DbClient,
  ) {}

  @Get('/')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK
  @ReturnedType(ProductResponseDto, true)
  async getAll(): Promise<ProductResponseDto[]> {
    try {
      const products = await this.productService.getAll();
      return products.map(ProductResponseDto.from);
    } catch (err: unknown) {
      console.error('🎪 Error fetching all products:', err);
      throw new CustomException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Failed to retrieve products'
      );
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK
  @ReturnedType(ProductResponseDto)
  async getById(@Param('id') rawId: string): Promise<ProductResponseDto> {
    const parse = IdParamSchema.safeParse(rawId);
    if (!parse.success) {
      throw new CustomException(
          HttpStatus.BAD_REQUEST,
          getZodMessage(parse.error),
      );
    }
    const id = parse.data;
    try {
      const product = await this.productService.getById(id);
      return ProductResponseDto.from(product);
    } catch (err: unknown) {
      if (err instanceof CustomException) throw err;
      throw new CustomException(
          HttpStatus.NOT_FOUND,
          `Product '${id}' not found`,
      );
    }
  }

  @Get(':id/details')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK
  @ReturnedType(ProductWithDetailsDto)
  async getDetails(@Param('id') rawId: string): Promise<ProductWithDetailsDto> {
    const parse = IdParamSchema.safeParse(rawId);
    if (!parse.success) {
      throw new CustomException(
          HttpStatus.BAD_REQUEST,
          getZodMessage(parse.error),
      );
    }
    const id = parse.data;
    try {
      const domain = await this.productService.getProductWithDetails(id);
      return ProductWithDetailsDto.from(domain);
    } catch (err: unknown) {
      if (err instanceof CustomException) throw err;

      console.error('🤡 Error fetching product details:', err);
      throw new CustomException(
          HttpStatus.NOT_FOUND,
          `Product '${id}' not found`,
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED) // Explicitly set 201 CREATED for resource creation
  @Roles('admin', 'brand')
  @UseGuard(RoleGuard)
  @ReturnedType(ProductResponseDto)
  async create(
      @Body() raw: unknown,
      @Context() context: HttpContext,
  ): Promise<ProductResponseDto> {
    console.log('🎪 Creating product with data:', raw);
    const result = CreateProductSchema.safeParse(raw);
    if (!result.success) {
      console.error('🤡 Product validation failed:', result.error);
      throw new CustomException(
          HttpStatus.BAD_REQUEST,
          getZodMessage(result.error),
      );
    }
    try {
      // Get user from context state
      const user = context.get('user');
      console.log('🎭 User from context:', user);
      if (!user) {
        console.error('🤡 No user found in context!');
        throw new CustomException(
            HttpStatus.UNAUTHORIZED,
            'User not found in context',
        );
      }

      // Get brand profile for this user - INLINED FUNCTIONALITY
      const brandProfile = await this.brandService.getByUserId(user.sub);
      if (!brandProfile) {
        throw new CustomException(
            HttpStatus.FORBIDDEN,
            'User does not have a brand profile',
        );
      }

      console.log('🎭 Found brand profile:', brandProfile);
      const validatedRaw = result.data;
      const dto = CreateProductDto.from({
        ...validatedRaw,
        brandId: brandProfile.id, // Use the brand profile ID
      });
      const product = dto.toProduct();
      console.log('🎭 Creating product:', product);

      try {
        const created = await this.productService.create(product);
        console.log('✨ Product created:', created);
        return ProductResponseDto.from(created);
      } catch (dbError) {
        console.error('🤡 Database error during product creation:', dbError);
        throw new CustomException(
            HttpStatus.CONFLICT,
            'Product creation failed, possible duplicate or constraint violation'
        );
      }
    } catch (error) {
      console.error('🤡 Product creation failed:', error);

      // Re-throw existing CustomExceptions
      if (error instanceof CustomException) throw error;

      // For unexpected errors
      throw new CustomException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'An unexpected error occurred while creating the product'
      );
    }
  }

  // Route to update a product: validates update data and merges with the existing product
  @Put(':id')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK for updates
  @Roles('admin', 'brand')
  @UseGuard(RoleGuard)
  @ReturnedType(ProductResponseDto)
  async update(
      @Param('id') rawId: string,
      @Body() raw: unknown,
      @Context() context: HttpContext,
  ): Promise<ProductResponseDto> {
    const parse = IdParamSchema.safeParse(rawId);
    if (!parse.success) {
      throw new CustomException(
          HttpStatus.BAD_REQUEST,
          getZodMessage(parse.error),
      );
    }
    const id = parse.data;
    const result = UpdateProductSchema.safeParse(raw);
    if (!result.success) {
      throw new CustomException(
          HttpStatus.BAD_REQUEST,
          getZodMessage(result.error),
      );
    }

    try {
      // Get existing product
      let existing;
      try {
        existing = await this.productService.getById(id);
      } catch (err) {
        throw new CustomException(
            HttpStatus.NOT_FOUND,
            `Product '${id}' not found`,
        );
      }

      // Authorization check - ensure user can modify this product
      const user = context.get('user');
      if (!user) {
        throw new CustomException(
            HttpStatus.UNAUTHORIZED,
            'User not found in context',
        );
      }

      // Only allow brand owners to update their own products
      if (user.role === 'brand') {
        const brandProfile = await this.brandService.getByUserId(user.sub);
        if (!brandProfile || brandProfile.id !== existing.brandId) {
          throw new CustomException(
              HttpStatus.FORBIDDEN,
              'You do not have permission to update this product',
          );
        }
      }

      const dto = result.data;
      const merged = UpdateProductDto.from(dto).mergeInto(existing);

      try {
        const updated = await this.productService.update(id, merged);
        return ProductResponseDto.from(updated);
      } catch (dbError) {
        console.error('🎪 Database error during product update:', dbError);
        throw new CustomException(
            HttpStatus.CONFLICT,
            'Product update failed, possible constraint violation'
        );
      }
    } catch (error) {
      // Re-throw existing CustomExceptions
      if (error instanceof CustomException) throw error;

      console.error('🤡 Unexpected error during product update:', error);
      throw new CustomException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'An unexpected error occurred while updating the product'
      );
    }
  }

  // Route to delete a product: returns the deleted product as a response DTO
  @Delete(':id')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK for successful deletion
  @Roles('admin', 'brand')
  @UseGuard(RoleGuard)
  @ReturnedType(ProductResponseDto)
  async delete(
      @Param('id') rawId: string,
      @Context() context: HttpContext,
  ): Promise<ProductResponseDto> {
    const parse = IdParamSchema.safeParse(rawId);
    if (!parse.success) {
      throw new CustomException(
          HttpStatus.BAD_REQUEST,
          getZodMessage(parse.error),
      );
    }
    const id = parse.data;

    try {
      // Get existing product first to check if it exists and for authorization
      let existing;
      try {
        existing = await this.productService.getById(id);
      } catch (err) {
        throw new CustomException(
            HttpStatus.NOT_FOUND,
            `Product '${id}' not found`,
        );
      }

      // Authorization check - ensure user can delete this product
      const user = context.get('user');
      if (!user) {
        throw new CustomException(
            HttpStatus.UNAUTHORIZED,
            'User not found in context',
        );
      }

      // Only allow brand owners to delete their own products
      if (user.role === 'brand') {
        const brandProfile = await this.brandService.getByUserId(user.sub);
        if (!brandProfile || brandProfile.id !== existing.brandId) {
          throw new CustomException(
              HttpStatus.FORBIDDEN,
              'You do not have permission to delete this product',
          );
        }
      }

      try {
        const deleted = await this.productService.delete(id);
        return ProductResponseDto.from(deleted);
      } catch (dbError) {
        console.error('🎪 Database error during product deletion:', dbError);
        throw new CustomException(
            HttpStatus.CONFLICT,
            'Product deletion failed, it may have associated records'
        );
      }
    } catch (error) {
      // Re-throw existing CustomExceptions
      if (error instanceof CustomException) throw error;

      console.error('🤡 Unexpected error during product deletion:', error);
      throw new CustomException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'An unexpected error occurred while deleting the product'
      );
    }
  }
}
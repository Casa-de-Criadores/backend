import 'reflect-metadata';
import { assertEquals } from '@std/assert';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import { DbClient } from '../database/client.ts';
import { BrandService } from '../brand/service.ts';
import { ProductService } from '../product/service.ts';
import { AuthService } from '../auth/service.ts';
import { createApp } from '../bootstrap.ts';
import { DanetApplication } from '@danet/core';
import { Product } from '../product/models/models.ts';
import { StubFunction, createStub, assertCalls } from './setup.ts';

describe('ProductController tests', () => {
  let app: DanetApplication;
  // Using our simplified StubFunction type
  let productServiceStub: {
    getAll: StubFunction;
    getById: StubFunction;
    create: StubFunction;
    update: StubFunction;
    delete: StubFunction;
  };
  let brandServiceStub: {
    getByUserId: StubFunction;
    getById: StubFunction;
  };
  let dbClientStub: StubFunction;
  let verifyTokenStub: StubFunction;

  // Create service instances
  let productService: ProductService;
  let brandService: BrandService;
  let dbClient: DbClient;
  let authService: AuthService;

  // Fixed test IDs for deterministic testing
  const ADMIN_USER_ID = "11111111-1111-1111-1111-111111111111";
  const BRAND_USER_ID = "22222222-2222-2222-2222-222222222222";
  const CUSTOMER_USER_ID = "33333333-3333-3333-3333-333333333333";
  const BRAND_PROFILE_ID = "44444444-4444-4444-4444-444444444444";
  const TEST_CATEGORY_ID = "55555555-5555-5555-5555-555555555555";
  const PRODUCT_ID = "66666666-6666-6666-6666-666666666666";

  // Auth tokens
  const ADMIN_TOKEN = "admin.auth.token";
  const BRAND_TOKEN = "brand.auth.token";
  const CUSTOMER_TOKEN = "customer.auth.token";

  // Sample product data
  const validProductData = {
    id: PRODUCT_ID,
    brandId: BRAND_PROFILE_ID,
    title: "Test Product",
    slug: "test-product",
    description: "A test product description",
    price: 99.99,
    mainImage: "https://example.com/image.jpg",
    images: [],
    categoryId: TEST_CATEGORY_ID,
    tagIds: [],
    currency: "USD",
    inventory: 100,
    isAvailable: true
  };

  const sampleProduct = new Product({
    id: PRODUCT_ID,
    brandId: BRAND_PROFILE_ID,
    title: "Test Product",
    price: 99.99,
    currency: "USD",
    description: "A test product description",
    mainImage: "https://example.com/image.jpg",
    images: [],
    categoryId: TEST_CATEGORY_ID,
    tagIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inventory: 100,
    isAvailable: true
  });

  beforeAll(async () => {
    console.error('🎪 Setting up test environment...');

    // Create the original service instances
    productService = new ProductService({} as any); // Pass mock dependencies if needed
    brandService = new BrandService({} as any);     // Pass mock dependencies if needed
    dbClient = new DbClient({} as any);             // Pass mock dependencies if needed
    authService = new AuthService({} as any);       // Pass mock dependencies if needed

    // 1. Setup ProductService stubs
    productServiceStub = {
      getAll: createStub(productService, 'getAll'),
      getById: createStub(productService, 'getById'),
      create: createStub(productService, 'create'),
      update: createStub(productService, 'update'),
      delete: createStub(productService, 'delete')
    };

    // Configure stub implementations
    productServiceStub.getAll.returns(Promise.resolve([sampleProduct]));

    productServiceStub.getById.returns((id: string) => {
      if (id === PRODUCT_ID) {
        return Promise.resolve(sampleProduct);
      }
      // For both "invalid-id-format" and non-existent ID, reject with error
      return Promise.reject(new Error("Product not found"));
    });

    productServiceStub.create.returns((product: Omit<Product, "id">) => {
      // Generate a new product with a unique ID
      return Promise.resolve(new Product({
        ...product,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    });

    productServiceStub.update.returns((id: string, updateData: Partial<Product>) => {
      if (id === PRODUCT_ID) {
        return Promise.resolve(new Product({
          ...sampleProduct,
          ...updateData,
          updatedAt: new Date().toISOString()
        }));
      }
      // For "invalid-id" or non-existent product, reject with error
      return Promise.reject(new Error("Product not found"));
    });

    productServiceStub.delete.returns((id: string) => {
      if (id === PRODUCT_ID) {
        return Promise.resolve(sampleProduct); // Return the deleted product
      }
      // For non-existent product, reject with error
      return Promise.reject(new Error("Product not found"));
    });

    // 2. Setup BrandService stubs
    brandServiceStub = {
      getByUserId: createStub(brandService, 'getByUserId'),
      getById: createStub(brandService, 'getById')
    };

    brandServiceStub.getByUserId.returns((userId: string) => {
      if (userId === ADMIN_USER_ID || userId === BRAND_USER_ID) {
        return Promise.resolve({
          id: BRAND_PROFILE_ID,
          userId: userId,
          title: 'Test Brand',
          slug: 'test-brand',
          status: 'active'
        });
      }
      return Promise.resolve(null);
    });

    brandServiceStub.getById.returns((id: string) => {
      if (id === BRAND_PROFILE_ID) {
        return Promise.resolve({
          id: BRAND_PROFILE_ID,
          userId: BRAND_USER_ID,
          title: 'Test Brand',
          slug: 'test-brand',
          status: 'active'
        });
      }
      return Promise.resolve(null);
    });

    // 3. Setup DbClient stub
    dbClientStub = createStub(dbClient, 'queryOne');
    dbClientStub.returns(Promise.resolve(undefined));

    // 4. Setup JWT verification for auth
    verifyTokenStub = createStub(authService, 'verifyToken');
    verifyTokenStub.returns((token: string) => {
      if (token === ADMIN_TOKEN) {
        return {
          id: ADMIN_USER_ID,
          login: 'admin',
          role: 'admin',
          sub: ADMIN_USER_ID
        };
      } else if (token === BRAND_TOKEN) {
        return {
          id: BRAND_USER_ID,
          login: 'brand',
          role: 'brand',
          sub: BRAND_USER_ID
        };
      } else if (token === CUSTOMER_TOKEN) {
        return {
          id: CUSTOMER_USER_ID,
          login: 'customer',
          role: 'customer',
          sub: CUSTOMER_USER_ID
        };
      }
      throw new Error('Invalid token');
    });

    // Create and start the app with our stubbed dependencies
    // You'd need to modify your createApp function to accept service overrides
    // or use dependency injection properly
    app = await createApp({
      // Provide your mocked services instead of real ones
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: BrandService, useValue: brandService },
        { provide: DbClient, useValue: dbClient },
        { provide: AuthService, useValue: authService }
      ]
    });
    await app.listen(3001);

    console.error('✨ Test environment setup complete');
  });

  afterAll(async () => {
    console.error('🎪 Cleaning up...');

    // Close the app
    await app.close();

    // Restore all stubs
    Object.values(productServiceStub).forEach(stub => stub.restore());
    Object.values(brandServiceStub).forEach(stub => stub.restore());
    dbClientStub.restore();
    verifyTokenStub.restore();
  });

  // #1 - GET ENDPOINTS TEST SUITE
  describe('GET endpoints', () => {
    it('should return all products', async () => {
      const response = await fetch('http://localhost:3001/product');

      try {
        assertEquals(response.status, 200, 'Should return 200 OK for getAll');

        const body = await response.json();
        assertEquals(Array.isArray(body), true, 'Response should be an array');
        assertEquals(body.length, 1, 'Should have one product');
        assertEquals(body[0].id, PRODUCT_ID, 'Should return the mocked product');

        // Verify the service method was called
        assertCalls(productServiceStub.getAll, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should return a product by ID', async () => {
      const response = await fetch(`http://localhost:3001/product/${PRODUCT_ID}`);

      try {
        assertEquals(response.status, 200, 'Should return 200 OK for getById');

        const body = await response.json();
        assertEquals(body.id, PRODUCT_ID, 'Should return the correct product');

        // Verify the service method was called with the right ID
        assertCalls(productServiceStub.getById, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should return 404 for non-existent product', async () => {
      const response = await fetch(`http://localhost:3001/product/99999999-9999-9999-9999-999999999999`);

      try {
        assertEquals(response.status, 404, 'Should return 404 Not Found');

        const body = await response.json();
        assertEquals(
            body.message,
            "404 - Product '99999999-9999-9999-9999-999999999999' not found",
            'Should return correct error message'
        );

        // Verify the service method was called with the right ID
        assertCalls(productServiceStub.getById, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should return 404 for invalid ID format', async () => {
      const response = await fetch(`http://localhost:3001/product/invalid-id-format`);

      try {
        assertEquals(response.status, 404, 'Should return 404 for invalid ID');

        const body = await response.json();
        assertEquals(
            body.message,
            "404 - Product 'invalid-id-format' not found",
            'Should return correct error message'
        );

        // Verify the service method was called with the invalid ID
        assertCalls(productServiceStub.getById, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });
  });

  // #2 - POST ENDPOINT TEST SUITE
  describe('POST endpoint', () => {
    it('should create a product when admin role is used', async () => {
      const response = await fetch('http://localhost:3001/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(validProductData)
      });

      try {
        assertEquals(response.status, 201, 'Should return 201 CREATED when admin creates product');

        const body = await response.json();
        assertEquals(body.title, validProductData.title, 'Should return product with correct title');
        assertEquals(body.brandId, BRAND_PROFILE_ID, 'Should use brand ID from user profile');

        // Verify service methods were called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.create, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should create a product when brand role is used', async () => {
      const response = await fetch('http://localhost:3001/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BRAND_TOKEN}`
        },
        body: JSON.stringify(validProductData)
      });

      try {
        assertEquals(response.status, 201, 'Should return 201 CREATED when brand creates product');

        const body = await response.json();
        assertEquals(body.title, validProductData.title, 'Should return created product with correct title');

        // Verify service methods were called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.create, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should reject product creation from customer role', async () => {
      const response = await fetch('http://localhost:3001/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CUSTOMER_TOKEN}`
        },
        body: JSON.stringify(validProductData)
      });

      try {
        assertEquals(response.status, 401, 'Should return 401 Unauthorized for customer role');

        // Verify token was verified but create wasn't called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.create, 0);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should reject product creation with invalid payload', async () => {
      const invalidData = {
        title: "Test Product",
        price: "not-a-number", // Wrong type
      };

      const response = await fetch('http://localhost:3001/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(invalidData)
      });

      try {
        assertEquals(response.status, 400, 'Should return 400 Bad Request for invalid payload');

        const body = await response.json();
        assertEquals(typeof body.message, "string", "Should include a validation error message");

        // Verify token was verified but create wasn't called due to validation
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.create, 0);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should reject product creation with no auth token', async () => {
      const response = await fetch('http://localhost:3001/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validProductData)
      });

      try {
        assertEquals(response.status, 401, 'Should return 401 Unauthorized with no token');

        // Verify create wasn't called due to auth failure
        assertCalls(productServiceStub.create, 0);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });
  });

  // #3 - PUT ENDPOINT TEST SUITE
  describe('PUT endpoint', () => {
    it('should update a product when admin role is used', async () => {
      const updateData = {
        title: "Updated Product Title",
        price: 129.99
      };

      const response = await fetch(`http://localhost:3001/product/${PRODUCT_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(updateData)
      });

      try {
        assertEquals(response.status, 200, 'Should return 200 OK when admin updates product');

        const body = await response.json();
        assertEquals(body.id, PRODUCT_ID, 'Should return the updated product');
        assertEquals(body.title, updateData.title, 'Should update the title');
        assertEquals(body.price, updateData.price, 'Should update the price');

        // Verify service methods were called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.update, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should reject product update with invalid ID', async () => {
      const response = await fetch(`http://localhost:3001/product/invalid-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({ title: "Updated Title" })
      });

      try {
        assertEquals(response.status, 404, 'Should return 404 for invalid ID format');

        const body = await response.json();
        assertEquals(
            body.message,
            "404 - Product 'invalid-id' not found",
            'Should return correct error message'
        );

        // Verify service methods were called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.update, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should return 404 when updating non-existent product', async () => {
      const nonExistentId = "99999999-9999-9999-9999-999999999999";

      const response = await fetch(`http://localhost:3001/product/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({ title: "Updated Title" })
      });

      try {
        assertEquals(response.status, 404, 'Should return 404 Not Found');

        const body = await response.json();
        assertEquals(
            body.message,
            "404 - Product '99999999-9999-9999-9999-999999999999' not found",
            'Should return correct error message'
        );

        // Verify service methods were called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.update, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });
  });

  // #4 - DELETE ENDPOINT TEST SUITE
  describe('DELETE endpoint', () => {
    it('should delete a product when admin role is used', async () => {
      const response = await fetch(`http://localhost:3001/product/${PRODUCT_ID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      try {
        assertEquals(response.status, 200, 'Should return 200 OK on successful delete');

        // Verify service methods were called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.delete, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should reject product deletion with customer role', async () => {
      const response = await fetch(`http://localhost:3001/product/${PRODUCT_ID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CUSTOMER_TOKEN}`
        }
      });

      try {
        assertEquals(response.status, 401, 'Should return 401 Unauthorized for customer role');

        // Verify token was verified but delete wasn't called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.delete, 0);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });

    it('should return 404 when deleting non-existent product', async () => {
      const nonExistentId = "99999999-9999-9999-9999-999999999999";

      const response = await fetch(`http://localhost:3001/product/${nonExistentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      try {
        assertEquals(response.status, 404, 'Should return 404 Not Found');

        const body = await response.json();
        assertEquals(
            body.message,
            "404 - Product '99999999-9999-9999-9999-999999999999' not found",
            'Should return correct error message'
        );

        // Verify service methods were called
        assertCalls(verifyTokenStub, 1);
        assertCalls(productServiceStub.delete, 1);
      } finally {
        if (!response.bodyUsed && response.body) {
          await response.body.cancel();
        }
      }
    });
  });
});
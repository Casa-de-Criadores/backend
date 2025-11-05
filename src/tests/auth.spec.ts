import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { AuthController } from "../auth/controller.ts";
import { AuthService } from "../auth/service.ts";
import { UserService } from "../user/service.ts"; // Adjust path as needed
import { CustomException, HttpStatus } from "../shared/exception.filter.ts";
import { LoginDto, LoginResponseDto } from "../auth/dto/login.dto.ts";
import { UserPublicDto } from "../user/dto/public.dto.ts"; // Adjust path as needed
import { createStub, assertCalls, assertCallArgs, StubFunction } from "./setup.ts";

describe("AuthController", () => {
    let authController: AuthController;
    let authServiceStub: StubFunction<AuthService, 'login'>;
    let authService: AuthService;
    let userService: UserService;

    beforeEach(() => {
        // Create UserService (might need to be stubbed too)
        userService = {} as UserService; // Using type assertion for simplicity

        // Create a fresh AuthService for each test and inject dependencies
        authService = new AuthService(userService);

        // Stub the login method using our custom stub function
        authServiceStub = createStub(authService, "login");

        // Inject our stubbed service into the controller
        authController = new AuthController(authService);
    });

    afterEach(() => {
        // Clean up stubs
        authServiceStub.restore();
    });

    describe("login()", () => {
        it("should validate input with Zod schema", async () => {
            // Test missing login field
            try {
                await authController.login({ password: "testpass123" });
                // Should not reach here
                assertEquals(true, false, "Should have thrown an exception");
            } catch (error: unknown) {
                // Type guard to ensure we have a CustomException
                if (!(error instanceof CustomException)) {
                    throw new Error(`Expected CustomException but got: ${error}`);
                }
                assertEquals(error.status, HttpStatus.BAD_REQUEST);
            }

            // Test missing password field
            try {
                await authController.login({ login: "testuser" });
                // Should not reach here
                assertEquals(true, false, "Should have thrown an exception");
            } catch (error: unknown) {
                if (!(error instanceof CustomException)) {
                    throw new Error(`Expected CustomException but got: ${error}`);
                }
                assertEquals(error.status, HttpStatus.BAD_REQUEST);
            }

            // No calls to service should be made for invalid input
            assertCalls(authServiceStub, 0);
        });

        it("should handle user not found error from service", async () => {
            // Stub service to return a rejected Promise
            authServiceStub.rejects(new Error("User not found"));

            try {
                await authController.login({ login: "nonexistent", password: "whatever123" });
                assertEquals(true, false, "Should have thrown an exception");
            } catch (error: unknown) {
                if (!(error instanceof CustomException)) {
                    throw new Error(`Expected CustomException but got: ${error}`);
                }
                assertEquals(error.status, HttpStatus.UNAUTHORIZED);
                assertEquals(error.message, "Invalid credentials");
            }

            // Verify service was called with expected params
            assertCalls(authServiceStub, 1);
            assertCallArgs(authServiceStub, 0, [new LoginDto("nonexistent", "whatever123")]);
        });

        it("should handle password error from service", async () => {
            // Stub service to return a rejected Promise
            authServiceStub.rejects(new Error("Incorrect password"));

            try {
                await authController.login({ login: "testauth", password: "wrongpassword" });
                assertEquals(true, false, "Should have thrown an exception");
            } catch (error: unknown) {
                if (!(error instanceof CustomException)) {
                    throw new Error(`Expected CustomException but got: ${error}`);
                }
                assertEquals(error.status, HttpStatus.UNAUTHORIZED);
                assertEquals(error.message, "Invalid credentials");
            }
        });

        it("should handle unexpected errors from service", async () => {
            // Stub service to return a rejected Promise with random error
            authServiceStub.rejects(new Error("Database connection failed"));

            try {
                await authController.login({ login: "testuser", password: "testpassword" });
                assertEquals(true, false, "Should have thrown an exception");
            } catch (error: unknown) {
                if (!(error instanceof CustomException)) {
                    throw new Error(`Expected CustomException but got: ${error}`);
                }
                assertEquals(error.status, HttpStatus.INTERNAL_SERVER_ERROR);
                assertEquals(error.message, "An error occurred during authentication");
            }
        });

        it("should handle null response from service", async () => {
            // Stub service to return null (which shouldn't happen but you check for it)
            authServiceStub.returns(null);

            try {
                await authController.login({ login: "testuser", password: "testpassword" });
                assertEquals(true, false, "Should have thrown an exception");
            } catch (error: unknown) {
                if (!(error instanceof CustomException)) {
                    throw new Error(`Expected CustomException but got: ${error}`);
                }
                assertEquals(error.status, HttpStatus.INTERNAL_SERVER_ERROR);
                assertEquals(error.message, "No response from login");
            }
        });

        it("should successfully login with valid credentials", async () => {
            // Create a proper UserPublicDto (you might need to adjust based on actual structure)
            const mockUser = {
                id: "1",
                login: "testauth",
                role: "customer",
                created_at: new Date().toISOString()
            } as UserPublicDto;

            // Create mock successful response from service using your DTOs
            const mockResponse = {
                token: "fake.jwt.token",
                user: mockUser
            };

            // Stub service to return success
            authServiceStub.returns(Promise.resolve(mockResponse));

            // Call controller method
            const result = await authController.login({
                login: "testauth",
                password: "correctpassword123"
            });

            // Verify result is a proper LoginResponseDto
            assertEquals(result instanceof LoginResponseDto, true);
            assertEquals(result.token, "fake.jwt.token");
            assertEquals(result.user.id, "1");
            assertEquals(result.user.login, "testauth");
            assertEquals(result.user.role, "customer");

            // Verify service was called with correct params
            assertCalls(authServiceStub, 1);
            assertCallArgs(authServiceStub, 0, [new LoginDto("testauth", "correctpassword123")]);
        });
    });
});
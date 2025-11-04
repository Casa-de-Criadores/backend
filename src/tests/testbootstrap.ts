import { DanetApplication } from '@danet/core';
import { CustomExceptionFilter } from '../shared/exception.filter.ts';
import {AuthMiddleware} from "../shared/middleware/auth.middleware.ts";
import {loggerMiddleware} from "../logger.middleware.ts";
import {MockDbClient} from "./setup.ts";
import {AppModule} from "../app.module.ts";
import {DbClient} from "../database/client.ts";

export async function createTestApp(): Promise<{ app: DanetApplication; mockDbClient: MockDbClient }> {
    // Create an instance of our MockDbClient
    const mockDbClient = new MockDbClient();

    // Create the app
    const app = new DanetApplication();

    // Initialize with the app module
    await app.init(AppModule);

    // Get the real DbClient from the container
    const realDbClient = app.get(DbClient);

    // Replace the real DbClient with our mock in the container
    // This is a hack, but it works
    app['container'].providers.set(
        DbClient,
        { useValue: mockDbClient }
    );

    // Also update any services that might have already gotten the real DbClient
    const userService = app.get('UserService');
    if (userService) {
        // Assuming your UserService has a property called dbClient
        userService.dbClient = mockDbClient;
    }

    // Set up the global exception filter
    const filter = app.get(CustomExceptionFilter);
    app.useGlobalExceptionFilter(filter);

    // Set up middleware
    app.addGlobalMiddlewares(
        AuthMiddleware,
        loggerMiddleware,
    );

    return { app, mockDbClient };
}
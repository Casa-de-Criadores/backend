import '@std/dotenv/load';
import { AppModule } from './app.module.ts';
import { DanetApplication } from '@danet/core';
import { loggerMiddleware } from './logger.middleware.ts';
import { AuthMiddleware } from './shared/middleware/auth.middleware.ts'
import { SpecBuilder, SwaggerModule } from '@danet/swagger';
import {MigrationService} from "./database/migrations.service.ts";
import {DbClient} from "./database/client.ts";
import {CustomExceptionFilter} from "./shared/exception.filter.ts";

/**
 * createApp():
 *  - initializes the DI graph (controllers, services, guards, filters)
 *  - mounts the global exception filter
 *  - registers exception/auth/logger middleware
 *
 * Useful for tests: you can do `const app = await createApp(); await app.listen(port);`
 */
export async function createApp(): Promise<DanetApplication> {
  const app = new DanetApplication();
  await app.init(AppModule);

  // 1) Global exception filter (catches all HttpException)
  const filter = app.get(CustomExceptionFilter);
  app.useGlobalExceptionFilter(filter);

  // 2) Middleware pipeline
  app.addGlobalMiddlewares(
      AuthMiddleware,    // inject ctx.user
      loggerMiddleware,  // log requests
  );

  return app;
}

/**
 * bootstrap():
 *  - runs DB migrations
 *  - builds the app via createApp()
 *  - sets up Swagger UI
 *  - starts listening on the configured PORT
 */
export async function bootstrap(): Promise<void> {
  // run migrations first
  await new MigrationService(new DbClient()).runMigrations();

  // build the app and mount everything
  const app = await createApp();

  // swagger/OpenAPI at /api
  const spec = new SpecBuilder()
      .setTitle('CDC‑Marketplace')
      .setDescription('The backend API')
      .setVersion('0.1‑clown‑alpha')
      .build();
  const document = await SwaggerModule.createDocument(app, spec);
  await SwaggerModule.setup('api', app, document);
  console.log('[BOOTSTRAP] Swagger UI available at /api');

  // finally, start the server
  const port = Number(Deno.env.get('PORT') || 48128);
  await app.listen(port);
  console.log(`🤡 App ready on http://localhost:${port}`);
}

if (import.meta.main) {
  bootstrap().catch(err => {
    console.error(err);
    Deno.exit(1);
  });
}
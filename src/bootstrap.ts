import '@std/dotenv/load';
import { AppModule } from './app.module.ts';
import { DanetApplication } from '@danet/core';
import { loggerMiddleware } from './logger.middleware.ts';
import { AuthMiddleware } from './shared/middleware/auth.middleware.ts'

import { RoleGuard } from './shared/guards/roles.guard.ts'

import { SpecBuilder, SwaggerModule } from '@danet/swagger';
export const bootstrap = async () => {
  const application = new DanetApplication();
  await application.init(AppModule);
  const spec = new SpecBuilder()
      .setTitle('CDC-Marketplace')
      .setDescription('The backend')
      .setVersion('0.1-clown-alpha')
      .build();
  const document = await SwaggerModule.createDocument(application, spec);
  await SwaggerModule.setup('api', application, document);

  application.addGlobalMiddlewares( AuthMiddleware, loggerMiddleware );

  console.log('[BOOTSTRAP] Auth middleware loaded');

  return application;
};

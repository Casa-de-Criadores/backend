import '@std/dotenv/load';
import { AppModule } from './app.module.ts';
import { DanetApplication } from '@danet/core';
import { loggerMiddleware } from './logger.middleware.ts';
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
  application.addGlobalMiddlewares(loggerMiddleware);
  return application;
};

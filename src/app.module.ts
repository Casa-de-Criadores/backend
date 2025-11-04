import { Injectable, Module } from '@danet/core';
import { AppController } from './app.controller.ts';
import { UserModule } from './user/module.ts';
import { RoleGuard } from './shared/guards/roles.guard.ts';
import { ProductModule } from './product/module.ts';
import { BrandModule } from './brand/module.ts';
import { AuthModule } from './auth/module.ts';
import { CustomExceptionFilter } from './shared/exception.filter.ts';
import { DatabaseModule } from './database/module.ts';
import { MigrationService } from './database/migrations.service.ts';
import { RouteSpyModule } from './route-spy.module.ts';

@Injectable()
class GlobalRoleGuard extends RoleGuard {}

@Module({
  controllers: [AppController],
  imports: [
    RouteSpyModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    ProductModule,
    BrandModule,
  ],
  injectables: [GlobalRoleGuard, CustomExceptionFilter],
})
export class AppModule {
  constructor(private readonly migrationService: MigrationService) {}

  async onApplicationBootstrap() {
    await this.migrationService.runMigrations();
  }
}

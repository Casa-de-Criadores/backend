import {Injectable, Module} from '@danet/core';
import {AppController} from './app.controller.ts';
import {UserModule} from "./user/module.ts";
import {RoleGuard} from "./shared/guards/roles.guard.ts";
import {ProductModule} from "./product/module.ts";
import {AuthModule} from "./auth/module.ts";
import {CustomExceptionFilter} from "./shared/exception.filter.ts";

@Injectable()
class GlobalRoleGuard extends RoleGuard {}

@Module({
  controllers: [AppController],
  imports: [AuthModule, UserModule, ProductModule],
  injectables: [GlobalRoleGuard, CustomExceptionFilter],
})
export class AppModule {}

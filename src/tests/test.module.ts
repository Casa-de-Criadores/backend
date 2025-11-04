import { Module, Injectable, DanetApplication } from '@danet/core';
import { CustomExceptionFilter } from '../shared/exception.filter.ts';
import {DatabaseModule} from "../database/module.ts";
import {AuthModule} from "../auth/module.ts";
import {UserModule} from "../user/module.ts";
import {ProductModule} from "../product/module.ts";
import {BrandModule} from "../brand/module.ts";
import {RoleGuard} from "../shared/guards/roles.guard.ts";
import {AppController} from "../app.controller.ts";
import {AuthMiddleware} from "../shared/middleware/auth.middleware.ts";
import {loggerMiddleware} from "../logger.middleware.ts";

@Injectable()
class GlobalRoleGuard extends RoleGuard {}

@Module({
    controllers: [AppController],
    imports: [
        DatabaseModule,
        AuthModule,
        UserModule,
        ProductModule,
        BrandModule,
    ],
    injectables: [GlobalRoleGuard, CustomExceptionFilter],
})
export class TestAppModule{}

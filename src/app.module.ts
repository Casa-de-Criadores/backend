import { Module, Injectable} from '@danet/core';
import {AppController} from './app.controller.ts';
import { UserController } from './user/controller.ts';
import {UserModule} from "./user/module.ts";
import {CustomExceptionFilter} from "./utils.ts";
import {RoleGuard} from "./shared/guards/roles.guard.ts";

@Injectable()
class GlobalRoleGuard extends RoleGuard {}

@Injectable()
class GlobalExceptionFilter extends CustomExceptionFilter {}

@Module({
    controllers: [AppController, UserController],
    imports: [UserModule],
    injectables: [GlobalRoleGuard, GlobalExceptionFilter],
})
export class AppModule {}
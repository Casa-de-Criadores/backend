import { GLOBAL_GUARD, Module, TokenInjector} from '@danet/core';
import {AppController} from './app.controller.ts';
import { UserController } from './user/controller.ts';
import {UserModule} from "./user/module.ts";
import {CustomExceptionFilter} from "./utils.ts";
import {RoleGuard} from "./shared/guards/roles.guard.ts";

@Module({
    controllers: [AppController, UserController],
    imports: [UserModule],
    providers: [
        new TokenInjector(RoleGuard, GLOBAL_GUARD),
        {
            provide: Symbol('APP_FILTER'),
            useClass: CustomExceptionFilter,
        },
    ],
})
export class AppModule {
}

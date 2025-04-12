import { Module } from '@danet/core';
import { TodoModule } from './todo/module.ts';
import { AppController } from './app.controller.ts';
import {UserModule} from "./user/module.ts";
import {CustomExceptionFilter} from "./utils.ts";
const APP_FILTER = Symbol('APP_FILTER');



@Module({
  controllers: [AppController],
  imports: [TodoModule, UserModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },
  ],
})
export class AppModule {}

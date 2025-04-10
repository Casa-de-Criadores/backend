import { Module } from '@danet/core';
import { TodoModule } from './todo/module.ts';
import { AppController } from './app.controller.ts';
import {UserModule} from "./user/module.ts";

@Module({
  controllers: [AppController],
  imports: [TodoModule, UserModule],
})
export class AppModule {}

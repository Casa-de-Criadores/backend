import { Module } from '@danet/core';
import { UserController } from './controller.ts';
import {UserService} from "./service.ts";

@Module({
  controllers: [UserController],
  injectables: [UserService],
})

export class UserModule {}

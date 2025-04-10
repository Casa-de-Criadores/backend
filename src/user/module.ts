import { Module } from '@danet/core';
import { UserController } from './controller.ts';

@Module({
  controllers: [UserController],
})

export class UserModule {}

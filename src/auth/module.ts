import {Module} from '@danet/core';
import {AuthController} from './controller.ts';
import {AuthService} from './service.ts';
import {UserModule} from "../user/module.ts";

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  injectables: [AuthService],
})
export class AuthModule {}

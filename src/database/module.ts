import { Module } from '@danet/core';
import { DbClient } from './client.ts';

@Module({
  injectables: [DbClient],
})
export class DatabaseModule {}

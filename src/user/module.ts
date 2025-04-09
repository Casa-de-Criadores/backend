import { TodoController } from './controller.ts';
import { TodoService } from './service.ts';
import { Module, TokenInjector } from '@danet/core';
import { USER_REPOSITORY } from './constant.ts';
import { MongodbRepository } from "./mongodb-repository.ts";
import { DatabaseModule } from "../database/module.ts";

@Module({
  controllers: [TodoController],
  injectables: [new TokenInjector(MongodbRepository, USER_REPOSITORY), TodoService], // change InMemoryTodoRepository by any custom repository using other database engine if needed
    imports: [DatabaseModule]
})
export class TodoModule {}

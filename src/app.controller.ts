import { Controller, Get } from '@danet/core';

@Controller('')
export class AppController {
  constructor() {
    console.log('🎯 AppController constructor called!');
  }

  @Get('')
  helloWorld() {
    console.log('🎯 AppController.helloWorld() called!');
    return 'Hello World';
  }
}
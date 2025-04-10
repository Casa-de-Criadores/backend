import { Injectable } from '@danet/core';
import { User } from './class.ts';

@Injectable()
export class UserService {
  private users: User[] = [];

  getAll(): User[] {
    return this.users;
  }

  getById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  create(user: User): User {
    user.id = crypto.randomUUID(); // swap this for ULID later
    this.users.push(user);
    return user;
  }

  update(id: string, user: Partial<User>): User | undefined {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.users[index] = { ...this.users[index], ...user };
    return this.users[index];
  }

  deleteOneById(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}

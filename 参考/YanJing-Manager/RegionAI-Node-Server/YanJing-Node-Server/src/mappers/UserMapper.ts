import { UserEntity } from '../entities/UserEntity.js'

export class UserMapper {
  private users: UserEntity[] = [
    new UserEntity(1, 'admin', 'admin@example.com'),
    new UserEntity(2, 'test', 'test@example.com')
  ]

  async selectAll(): Promise<UserEntity[]> {
    return this.users
  }

  async selectById(id: number): Promise<UserEntity | undefined> {
    return this.users.find((u) => u.id === id)
  }
}

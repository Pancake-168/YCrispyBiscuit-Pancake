import { UserMapper } from '../mappers/UserMapper.js'
import type { UserEntity } from '../entities/UserEntity.js'
import type { UserResponseSchema } from '../schemas/UserSchema.js'

export class UserService {
  private readonly userMapper = new UserMapper()

  async getAllUsers(): Promise<UserResponseSchema[]> {
    const users = await this.userMapper.selectAll()
    return users.map((u: UserEntity) => ({ id: u.id, username: u.username, email: u.email }))
  }

  async getUserById(id: number): Promise<UserResponseSchema | undefined> {
    const user = await this.userMapper.selectById(id)
    if (!user) return undefined
    return { id: user.id, username: user.username, email: user.email }
  }
}

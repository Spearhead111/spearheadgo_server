import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(user: Partial<User>) {
    const { username } = user;
    const userInfo = await this.userRepository.findOne({
      where: { username },
    });
    const token = this.createToken({
      id: userInfo.id,
      username: userInfo.username,
      role: userInfo.role,
      avatar: userInfo.avatar,
    });

    return { data: { token } };
  }

  // 生成token
  createToken(user: Partial<User>) {
    return this.jwtService.sign(user);
  }

  async getUser(user: Partial<User>) {
    const { username, id, role } = user;
    const existUser = await this.userRepository.findOne({
      where: { username, id, role },
    });
    return !!existUser;
  }
}

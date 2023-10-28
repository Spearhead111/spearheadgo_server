import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  // 使用InjectRepository装饰器并引入Repository即可使用typeorm的操作
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { username } = createUserDto;

    const existUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existUser) {
      return {
        result_code: 'user_already_exist',
        message: 'user already exist',
      };
    }

    const newUser = await this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  async findAll() {
    const list = await this.userRepository.query('select * from user');
    const total = await this.userRepository.query(
      `select * from user where isActivated = 1`,
    );
    return { data: { list, total } };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user;
  }

  async findUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    const isExisted = await this.userRepository.query(
      `SELECT id FROM user WHERE id = ${id} and isActivated = 1`,
    );
    if (!isExisted.length) {
      return { result_code: 'user_not_found', message: 'user may not exist' };
    } else {
      const res = await this.userRepository.query(
        `UPDATE user set isActivated = 0 WHERE id = ${id}`,
      );
    }

    return {};
  }
}

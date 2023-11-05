import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Base64 } from 'js-base64';
import { GetUserListDto } from './dto/get-user-list.dto';

@Injectable()
export class UserService {
  // 使用InjectRepository装饰器并引入Repository即可使用typeorm的操作
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 注册用户 */
  async register(createUserDto: CreateUserDto) {
    const { username } = createUserDto;

    const existUser = await this.userRepository.findOne({
      where: { username },
    });
    // 解码密码
    createUserDto.password = Base64.decode(
      Base64.decode(createUserDto.password),
    );
    if (existUser) {
      return {
        result_code: 'user_already_exist',
        message: 'user already exist',
      };
    }

    const newUser = await this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  /** 查找所有用户列表 */
  async getAllUsers(getUserListDto: GetUserListDto) {
    let { pageNo, pageSize, search, role, isActivated } = getUserListDto;
    isActivated = Number(isActivated);
    pageNo = Number(pageNo);
    pageSize = Number(pageSize);
    const roleList = role.split(',');
    const skip = (pageNo - 1) * pageSize;
    let query = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.articles', 'articles')
      .select([
        'user.id AS id',
        'user.username AS username',
        'user.nickname AS nickname',
        'user.email AS email',
        'user.createTime AS createTime',
        'user.updateTime AS updateTime',
        'user.role AS role',
        'user.isActivated AS isActivated',
        'COUNT(DISTINCT articles.id) AS articlesCount',
      ])
      .where('user.username LIKE :keyword', {
        keyword: `%${search}%`,
      })
      .orWhere('user.nickname LIKE :keyword', {
        keyword: `%${search}%`,
      })
      .groupBy('user.id');

    // 如果有角色查询条件
    if (role) {
      query = query.andWhere('user.role IN (:...roleList)', {
        roleList: roleList,
      });
    }
    // 如果有用户状态查询条件
    if (isActivated !== -1) {
      // 字段值不为-1说明有查询条件，-1是查询全部
      query = query.where('user.isActivated = :isActivated', {
        isActivated: isActivated,
      });
    }
    // 分页
    query = query.offset(skip).limit(pageSize);
    const total = await query.getCount();
    const list = await query.getRawMany();
    list.forEach((user) => {
      user.articlesCount = Number(user.articlesCount);
      user.createTime = new Date(user.createTime).getTime();
      user.updateTime = new Date(user.updateTime).getTime();
    });

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

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Base64 } from 'js-base64';
import { GetUserListDto } from './dto/get-user-list.dto';
import { ChangeUserStatusDto } from './dto/change-user-status.dto';
import { USER_ROLE_MAP } from 'src/constants/common';
import { checkAuthLT } from 'src/utils';

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
        result_code: 'user_name_already_exist',
        message: 'user name already exist',
      };
    }

    const newUser = this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  /** 查找所有用户列表 */
  async getAllUsers(getUserListDto: GetUserListDto) {
    let { pageNo, pageSize, search, role, status } = getUserListDto;
    status = isNaN(Number(status)) ? -1 : Number(status);
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
      .groupBy('user.id');

    if (search) {
      query = query.where(
        '(user.username LIKE :keyword OR user.nickname LIKE :keyword)',
        { keyword: `%${search}%` },
      );
    }
    // 如果有用户状态查询条件
    if (status !== -1) {
      // 字段值不为-1说明有查询条件，-1是查询全部
      query = query.andWhere('user.isActivated = :isActivated', {
        isActivated: status,
      });
    }
    // 如果有角色查询条件
    if (role) {
      query = query.andWhere('user.role IN (:...roleList)', {
        roleList: roleList,
      });
    }

    // 分页
    query = query
      .orderBy('user.createTime', 'DESC')
      .offset(skip)
      .limit(pageSize);

    const total = await query.getCount();
    const list = await query.getRawMany();
    list.forEach((user) => {
      user.articlesCount = Number(user.articlesCount);
      user.createTime = new Date(user.createTime).getTime();
      user.updateTime = new Date(user.updateTime).getTime();
    });

    return {
      data: {
        has_next: (pageNo - 1) * pageSize + pageSize < total,
        list,
        total,
      },
    };
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

  /** 更新用户信息 */
  async update(id: string, updateUserDto: UpdateUserDto, user: User) {
    const userInfo = await this.userRepository.findOne({ where: { id } });
    if (!userInfo) {
      return { result_code: 'user_id_not_found', message: '用户不存在' };
    }
    // 判断操作用户是否有权限改目标用户信息
    // 1. 做操作的用户的权限必须大于更改目标的原始权限
    // 2. 做操作的用户的权限不许大于更改目标要更改的权限
    if (
      !checkAuthLT(user.role, userInfo.role) ||
      !checkAuthLT(user.role, updateUserDto.role)
    ) {
      return { result_code: 'has_no_permission', message: '无权操作' };
    }
    userInfo.role = updateUserDto.role;

    return await this.userRepository.save(userInfo);
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

  /** 更改用户状态(isActivated字段) */
  async changeUserStatus(query: ChangeUserStatusDto, operateUser: User) {
    const user = await this.userRepository.findOne({
      where: {
        id: query.id,
      },
    });
    if (!user) {
      return { result_code: 'user_id_not_found', message: '用户id不存在' };
    } else if (
      operateUser?.role !== USER_ROLE_MAP.ROOT &&
      (user.role === USER_ROLE_MAP.ADMIN || user.role === USER_ROLE_MAP.ROOT)
    ) {
      // 非ROOT操作者无权更改管理员的信息
      return { result_code: 'has_no_permission', message: '无权操作' };
    } else if (user.isActivated === query.isActivated) {
      return {
        result_code: 'user_already_current_status',
        message: '用户当前已经是此状态',
      };
    }
    user.isActivated = query.isActivated;
    // @ts-ignore
    user.updateTime = new Date();
    return await this.userRepository.save(user);
  }
}

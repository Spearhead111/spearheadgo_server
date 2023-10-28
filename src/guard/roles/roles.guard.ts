import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserService } from 'src/modules/user/user.service';
import { judegAuth } from 'src/utils/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    // 从请求头获取用户id
    const id = request.headers['user-id'];
    if (!id) {
      throw new ForbiddenException('无权限，请联系管理员');
    }
    // 使用数据库服务查询用户
    const user = await this.userService.findUserById(id);
    const userRole = user.role.split(',');
    if (!judegAuth(roles, userRole)) {
      throw new ForbiddenException('无权限，请联系管理员');
    }
    return true;
  }
}

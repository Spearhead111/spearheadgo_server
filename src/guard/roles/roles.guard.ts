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
    const { role } = request.user;
    if (!role) {
      throw new ForbiddenException('无权限，请联系管理员');
    }
    if (!judegAuth(roles, role)) {
      throw new ForbiddenException('无权限，请联系管理员');
    }
    return true;
  }
}

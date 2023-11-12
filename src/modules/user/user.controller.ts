import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  SetMetadata,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { GetUserListDto } from './dto/get-user-list.dto';
import { USER_ROLE_MAP } from 'src/constants/common';
import { ChangeUserStatusDto } from './dto/change-user-status.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('用户')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    if (!createUserDto.avatar) {
      createUserDto.avatar = this.configService.get('DEFAULT_AVATAR');
    }
    return this.userService.register(createUserDto);
  }

  // 获取所有用户列表
  @Get('get-user-list')
  @UseGuards(AuthGuard('jwt'))
  @SetMetadata('roles', [USER_ROLE_MAP.ADMIN]) // 需要 admin 权限
  getAllUsers(@Query() query: GetUserListDto) {
    return this.userService.getAllUsers(query);
  }

  @Get(':id/get-user')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post(':id/update-user')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Get(':id/delete-user')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.ADMIN])
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  /** 改变用户状态 */
  @Get(':id/change-user-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.ADMIN])
  changeUserStatus(
    @Param('id') id: string,
    @Query() query: ChangeUserStatusDto,
    @Req() { user },
  ) {
    query.isActivated = +query.isActivated;
    return this.userService.changeUserStatus(query, user);
  }
}

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

@ApiTags('用户')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  // 获取所有用户列表
  @Get('get-user-list')
  @UseGuards(AuthGuard('jwt'))
  @SetMetadata('roles', ['admin']) // 需要 admin 权限
  getAllUsers(@Query() query: GetUserListDto) {
    console.log(query);
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
  @SetMetadata('roles', ['root'])
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

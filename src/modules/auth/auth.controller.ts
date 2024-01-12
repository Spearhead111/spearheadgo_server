import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  Req,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { USER_ROLE_MAP } from 'src/constants/common';
import { ConfigService } from '@nestjs/config';
const COS = require('cos-nodejs-sdk-v5');

@ApiTags('验证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard('local'))
  async login(@Body() user: LoginDto) {
    return this.authService.login(user);
  }

  @Get('verify')
  @UseGuards(AuthGuard('jwt'))
  async verify() {
    return this.authService.verify();
  }

  @Get('cos/article-sign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.AUTHOR])
  async uploadArticleImgPermission(
    @Query() query: { key: string; size: number },
  ) {
    const { key, size } = query;
    if (size > 1024 * 1024 * this.configService.get('UP_IMG_LIMIT')) {
      return {
        result_code: 'file_exceed_limit',
        message: '上传图片大小不能超过2M',
      };
    }
    const cos = new COS({
      SecretId: this.configService.get('COS_SECRET_ID'),
      SecretKey: this.configService.get('COS_SECRET_KEY'),
    });
    const params = {
      Bucket: this.configService.get('BUCKET_NAME'), // 替换为你的 COS Bucket 名称
      Region: this.configService.get('BUCKET_REGION'), // 替换为你的 COS Bucket 所在地域
      Key: 'img/article/' + key, // 文件的唯一标识符
      Method: 'PUT',
      Expires: 300, // 预签名 URL 的有效期（单位：秒）
    };
    const url = await cos.getObjectUrl(
      params,
      async (err: any, data: any) => {},
    ); // 获取上传url
    const imgUrl = this.configService.get('BUCKET_DOMAIN') + params.Key; // 图片上传成功后的url
    const data = { imgUrl: imgUrl, uploadUrl: url };
    return url
      ? { data }
      : { result_code: 'upload_failed', message: '上传失败' };
  }
}

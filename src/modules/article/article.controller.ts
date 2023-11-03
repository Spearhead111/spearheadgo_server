import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  SetMetadata,
  Request,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import {
  CreateArticleDto,
  CreateArticleOriginDto,
} from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { USER_ROLE_MAP } from 'src/constants/common';
import { SearchArticleDto } from './dto/search-article.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Express } from 'express';
import { FileService } from 'src/services/upload.service';
import { User } from '../user/entities/user.entity';
import { buffer } from 'stream/consumers';
import { ConfigService } from '@nestjs/config';

@ApiTags('文章')
@Controller('article')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly fileService: FileService,
    private readonly configService: ConfigService,
  ) {}

  /** 添加文章 */
  @Post('create-article')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.AUTHOR]) // 需要写作权限
  @UseInterceptors(FileInterceptor('banner')) // 这里指定字段名 'banner'
  async createArticle(
    @UploadedFile() file, // 获取上传的文件
    @Body() body: CreateArticleOriginDto, // 获取其他参数
    @Req() { user },
  ) {
    // 判断封面图片大小是否超过限制
    if (file.size > 1024 * 1024 * 1) {
      return {
        result_code: 'bannerimg_exceed_limitation',
        message: '图片大小超过限制',
      };
    }
    console.log(file.originalname, file.type, file.size, body, user);
    // 拼接一下在cos上的路径
    const fileName = `img/article/banner_${
      (user as User).id
    }_${new Date().getTime()}.${body.fileType}`;
    // 存储路径
    const imgUrl = await this.fileService.uploadStreamToCOS(
      file.buffer,
      fileName,
    );
    console.log(imgUrl);
    const createArticle = new CreateArticleDto();
    createArticle.title = body.title;
    createArticle.subtitle = body.subtitle;
    createArticle.desc = body.desc;
    createArticle.banner = imgUrl;
    createArticle.content = body.content;
    // 取出文章的categoriesID用于后面存关联的categories
    const categoriesIds = (JSON.parse(body.tags) as any[]).map((tag) => tag.id);
    return this.articleService.createArticle(
      createArticle,
      user,
      categoriesIds,
    );
  }

  /** 获取文章列表 */
  @Get('get-article-list')
  getArticleList(@Query() query: SearchArticleDto) {
    return this.articleService.getArticleList(query);
  }

  /** 获取文章详情 */
  @Get(':article_id/get-article-detail')
  getArticleDetail(@Param('article_id') id: string) {
    return this.articleService.getArticleDetail(+id);
  }

  /** 更新文章 */
  @Post(':article_id/update-article')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.AUTHOR]) // 需要写作权限
  @UseInterceptors(FileInterceptor('banner')) // 这里指定字段名 'banner'
  async updateArticle(
    @Param('article_id') id: string,
    @UploadedFile() file, // 获取上传的文件 要配合UseInterceptors使用
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() { user },
  ) {
    if (file) {
      // 判断封面图片大小是否超过限制
      if (file.size > 1024 * 1024 * 1) {
        return {
          result_code: 'bannerimg_exceed_limitation',
          message: '图片大小超过限制',
        };
      }
      // 拼接一下在cos上的路径
      const fileName = `img/article/banner_${
        (user as User).id
      }_${new Date().getTime()}.${updateArticleDto.fileType}`;
      // 存储路径
      const imgUrl = await this.fileService.uploadStreamToCOS(
        file.buffer,
        fileName,
      );
      updateArticleDto.banner = imgUrl;
    }
    return this.articleService.updateArticle(+id, updateArticleDto, user);
  }

  /** 删除文章 */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.ROOT]) // 需要写作权限
  @Get(':article_id/delete-article')
  deleteArticle(@Param('article_id') id: string) {
    console.log(id);
    return this.articleService.deleteArticle(+id);
  }
}

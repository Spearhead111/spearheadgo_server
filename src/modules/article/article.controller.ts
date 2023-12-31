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
  Headers,
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
import { GetAdminArticleDto } from './dto/get-admin-article.dto';
import { GetLatestArticleDto } from './dto/get-latest-article.dto';
import { SendArticleCommentDto } from './dto/send-article-comment.dto';
import { SendArticleCommentReplyDto } from './dto/send-article-comment-reply.dto';
import { GetArticleCommentDto } from './dto/get-article-comment.dto';
import { DeleteArticleCommentDto } from './dto/delete-article-comment.dto';
import { LikeArticleCommentDto } from './dto/like-article-comment.dto';

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
    // 拼接一下在cos上的路径
    const fileName = `img/article/banner_${
      (user as User).id
    }_${new Date().getTime()}.${body.fileType}`;
    // 存储路径
    const imgUrl = await this.fileService.uploadStreamToCOS(
      file.buffer,
      fileName,
    );
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

  /** 获取文章关联的用户信息 */
  @Get(':articleId/get-article-user-info')
  @UseGuards(AuthGuard('jwt'))
  async getArticleUserInfo(
    @Param('articleId') articleId: string,
    @Req() { user },
  ) {
    return this.articleService.getArticleUserInfo(+articleId, user);
  }

  /** 删除文章 */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.ADMIN])
  @Get(':article_id/delete-article')
  deleteArticle(@Param('article_id') id: string, @Req() { user }) {
    return this.articleService.deleteArticle(+id, user);
  }

  /** 恢复文章上线状态 */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.ADMIN])
  @Get(':article_id/recover-article')
  recoverArticle(@Param('article_id') id: string, @Req() { user }) {
    return this.articleService.recoverArticle(+id, user);
  }

  /** 获取文章列表管理版 */
  @Get('admin-article-list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.ADMIN])
  async getAdminArticleList(
    @Query() body: GetAdminArticleDto, // 获取其他参数
  ) {
    return this.articleService.getAdminArticleList(body);
  }

  /** 获取最新发布的文章 */
  @Get('get-latest-articles')
  getLatestArticle(@Query() query: GetLatestArticleDto) {
    return this.articleService.getLatestArticle(query);
  }

  /** 点赞文章 */
  @Get(':articleId/digging-article')
  @UseGuards(AuthGuard('jwt'))
  likeArticle(@Param('articleId') articleId: string, @Req() { user }) {
    return this.articleService.likeArticle(+articleId, user);
  }

  /** 获取文章评论 */
  @Get(':article_id/get-article-comment')
  getArticleComment(
    @Param('article_id') id: string,
    @Query() query: GetArticleCommentDto,
    @Headers() headers: Record<string, string>,
  ) {
    const userId = headers['user-id'];
    return this.articleService.getArticleComment(+id, query, userId);
  }

  /** 发表文章评论 */
  @Post(':articleId/comment-article')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  sendArticleComment(
    @Param('article_id') id: string,
    @Body() body: SendArticleCommentDto,
    @Req() { user },
  ) {
    return this.articleService.sendArticleComment(body, user);
  }

  /** 发表文章评论的回复 */
  @Post(':articleId/reply-comment-article')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  sendArticleCommentReply(
    @Param('articleId') id: number,
    @Body() body: SendArticleCommentReplyDto,
    @Req() { user },
  ) {
    return this.articleService.sendArticleCommentReply(id, body, user);
  }

  /** 删除文章评论 */
  @Post(':articleId/delete-article-comment')
  @UseGuards(AuthGuard('jwt'))
  deleteArticleComment(
    @Param('articleId') id: number,
    @Body() body: DeleteArticleCommentDto,
    @Req() { user },
  ) {
    return this.articleService.deleteArticleComment(id, body, user);
  }

  /** 点赞评论 */
  @Post('/digging-comments')
  @UseGuards(AuthGuard('jwt'))
  likeArticleComment(@Body() body: LikeArticleCommentDto, @Req() { user }) {
    return this.articleService.likeArticleComment(body, user);
  }
}

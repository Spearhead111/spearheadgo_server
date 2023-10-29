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
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { USER_ROLE_MAP } from 'src/constants/common';
import { SearchArticleDto } from './dto/search-article.dto';

@ApiTags('文章')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /** 添加文章 */
  @Post('add-article')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.AUTHOR]) // 需要写作权限
  create(@Body() createArticleDto: CreateArticleDto, @Req() { user }) {
    console.log(createArticleDto, user);
    return this.articleService.create(createArticleDto, user);
  }

  /** 获取文章列表 */
  @Get('get-article-list')
  getArticleList(@Query() query: SearchArticleDto) {
    console.log(query);
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
  update(
    @Param('article_id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    console.log(id, updateArticleDto);
    return this.articleService.update(+id, updateArticleDto);
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

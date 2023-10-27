import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articleService.create(createArticleDto);
  }

  @Get('get-article-list')
  findAll(@Query() query) {
    console.log(query);
    return this.articleService.findAll();
  }

  @Get('get-article/:article_id')
  findOne(@Param('article_id') id: string) {
    return this.articleService.findOne(+id);
  }

  @Post('update/:article_id')
  update(
    @Param('article_id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    console.log(id, updateArticleDto);
    return this.articleService.update(+id, updateArticleDto);
  }

  @Get('delete/:article_id')
  remove(@Param('id') id: string) {
    return this.articleService.remove(+id);
  }
}

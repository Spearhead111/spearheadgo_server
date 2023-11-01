import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('文章类型')
@Controller('article')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /** 获取文章标签 */
  @Get('get-article-categories')
  getArticleCategories() {
    return this.categoryService.getArticleCategories();
  }
}

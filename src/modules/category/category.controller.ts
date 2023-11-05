import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { USER_ROLE_MAP } from 'src/constants/common';

@ApiTags('文章类型')
@Controller('article')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /** 获取文章标签 */
  @Get('get-article-categories')
  getArticleCategories() {
    return this.categoryService.getArticleCategories();
  }

  /** 新建文章标签 */
  @Post('create-category')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.AUTHOR]) // 需要写作权限
  createArticleTag(@Body() body: CreateCategoryDto) {
    return this.categoryService.createArticleTag(body);
  }

  /** 更新文章标签 */
  @Post('update-category')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [USER_ROLE_MAP.AUTHOR]) // 需要写作权限
  updateArticleCategory(@Body() body: UpdateCategoryDto) {
    return this.categoryService.updateArticleCategory(body);
  }
}

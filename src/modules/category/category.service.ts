import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /** 获取文章标签 */
  async getArticleCategories() {
    const categories = await this.categoryRepository.findAndCount();
    return { data: { list: categories[0], total: categories[1] } };
  }

  /** 创建文章标签 */
  async createArticleTag(createCategoryDto: CreateCategoryDto) {
    const oldCategory1 = await this.categoryRepository.findOne({
      where: {
        label: createCategoryDto.label,
      },
    });
    if (oldCategory1) {
      return {
        result_code: 'category_label_already_exist',
        message: '标签名已存在',
      };
    }
    const oldCategory2 = await this.categoryRepository.findOne({
      where: {
        code: createCategoryDto.code,
      },
    });
    if (oldCategory2) {
      return {
        result_code: 'category_code_already_exist',
        message: '标签code已存在',
      };
    }
    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  /** 更新文章标签 */
  async updateArticleCategory(updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: updateCategoryDto.id,
      },
    });
    if (!category) {
      return {
        result_code: 'category_id_not_found',
        message: '文章标签id不存在',
      };
    }
    category.label = updateCategoryDto.label;
    category.code = updateCategoryDto.code;
    category.icon = updateCategoryDto.icon;
    category.color = updateCategoryDto.color;
    category.iconColor = updateCategoryDto.iconColor;
    return await this.categoryRepository.save(category);
  }

  /** 删除文章标签 */
  async deleteArticleCategory(id: number) {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
      },
      relations: ['articles'],
    });
    if (!category) {
      return {
        result_code: 'category_id_not_found',
        message: '文章标签id不存在',
      };
    }
    if (category.articles.length > 0) {
      return {
        result_code: 'category_has_realted_to_articles',
        message: '当前有文章与该标签关联，无法删除',
      }
    }
    return await this.categoryRepository.remove(category);
  }
}

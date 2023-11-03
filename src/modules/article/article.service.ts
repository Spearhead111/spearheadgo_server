import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { In, Repository, Timestamp } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { SearchArticleDto } from './dto/search-article.dto';
import { USER_ROLE_MAP } from 'src/constants/common';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class ArticleService {
  // 使用InjectRepository装饰器并引入Repository即可使用typeorm的操作
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    // 要想在别的模块中使用别的repository<实体>必须要在当前模块的imports的TypeOrmModule.forFeature([])中加入这个实体
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /** 创建文章 */
  async createArticle(
    createArticleDto: CreateArticleDto,
    user: User,
    categoriesIds: number[],
  ) {
    const newArticle = this.articleRepository.create(createArticleDto);
    newArticle.author = user;
    // 获取与文章关联的分类实例
    const categories = await this.categoryRepository.findBy({
      id: In(categoriesIds),
    });
    newArticle.categories = categories;
    const articleId = (await this.articleRepository.save(newArticle)).id;
    return { data: { articleId } };
  }

  /** 查找有效的文章个数 */
  async getArticleCount() {
    return this.articleRepository.count({
      where: { isActivated: 1 },
    });
  }

  /** 查询所有没删除的文章 */
  async getArticleList(searchArticleDto: SearchArticleDto) {
    const { pageNo, tagIdListStr, pageSize, search } = searchArticleDto;
    const tagIdList = tagIdListStr
      ? tagIdListStr.split(',').map((tagId) => +tagId)
      : [];
    const skip = (pageNo - 1) * pageSize;
    console.log(skip, pageNo, pageSize);
    let query = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.articleComments', 'comments')
      .leftJoinAndSelect('article.articleLikes', 'likes')
      .leftJoinAndSelect('article.categories', 'categories')
      .select([
        'article.id',
        'article.title',
        'article.subtitle',
        'article.banner',
        'article.desc',
        'article.createTime',
        'article.updateTime',
        'author.nickname',
        'author.id AS auth_id',
        'CAST(COUNT(DISTINCT comments.id) AS SIGNED) AS comments', // 使用 CAST 转换为数字类型 但是没起作用啊 晕
        'CAST(COUNT(DISTINCT likes.id) AS SIGNED) AS likes', // 使用 CAST 转换为数字类型
        'GROUP_CONCAT(categories.id) AS categoriesIds',
      ])
      .where('article.title LIKE :keyword', { keyword: `%${search}%` })
      .orWhere('article.subtitle LIKE :keyword', { keyword: `%${search}%` })
      .orWhere('article.desc LIKE :keyword', { keyword: `%${search}%` })
      .where({ isActivated: 1 }) // 只查没被删除的文章  这个一定是写在前面模糊匹配之后的
      .groupBy('article.id'); // 添加 GROUP BY 子句以满足聚合要求

    if (tagIdList.length) {
      // 如果有标签id 则添加标签查询条件
      query = query
        .where('categories.id IN (:...tagIdList)', { tagIdList })
        .having('COUNT(DISTINCT  categories.id) >= :categoryCount', {
          categoryCount: tagIdList.length,
        });
    }

    query
      .orderBy('article.id', 'DESC') // 按文章的id降序(新的在上面)
      .offset(skip)
      .limit(pageSize);

    const articles = await query.getRawMany();

    const count = 0;
    if (!articles?.length) {
      return { data: { list: [], total: 0 } };
    }
    // 查询文章的类别信息
    const articleIds = articles.map((article) => article.article_id);
    const categoriesList = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.categories', 'categories')
      .select(['article.id', 'categories'])
      .where('article.id IN (:...ids)', { ids: articleIds })
      .getMany();

    // 将类别信息关联到文章对象中
    articles.forEach((article) => {
      // 在这里做一下转换吧 把字符串转数字
      article.comments = Number(article.comments);
      article.likes = Number(article.likes);
      article.categories = categoriesList.find(
        (category) => category.id === article.article_id,
      ).categories;
    });

    return {
      data: {
        has_next: (pageNo - 1) * pageSize + pageSize < count,
        total: count,
        list: articles,
      },
    };
  }

  /** 查询文章详情 */
  async getArticleDetail(id: number) {
    const article = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .leftJoin('article.categories', 'categories')
      .leftJoin('article.articleComments', 'comments')
      .leftJoin('article.articleLikes', 'likes')
      .select([
        'article',
        'author.id',
        'author.username',
        'author.nickname',
        'categories.id',
        'categories.code',
        'categories.label',
        'categories.color',
        'categories.icon',
        'categories.iconColor',
      ])
      .where({ id }) // 根据文章的 ID 进行过滤
      .andWhere({ isActivated: 1 })
      .getOne();

    const count = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.articleComments', 'comments')
      .leftJoin('article.articleLikes', 'likes')
      .select([
        'COUNT(DISTINCT comments.id) AS commentCount',
        'COUNT(DISTINCT likes.id) AS likeCount',
      ])
      .where({ id }) // 根据文章的 ID 进行过滤
      .andWhere({ isActivated: 1 })
      .groupBy('article.id')
      .getRawOne();

    const data = Object.assign(article, {
      commentCount: Number(count.commentCount),
      likeCount: Number(count.likeCount),
    });

    if (data) {
      return { data: data };
    } else {
      return { result_code: 'article_id_not_found', message: '没找到文章' };
    }
  }

  // 更新文章
  async updateArticle(
    id: number,
    updateArticleDto: UpdateArticleDto,
    user: User,
  ) {
    const article = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.id = :id', { id })
      .getOne();
    if (!article) {
      return { result_code: 'article_id_not_found', message: '没找到文章' };
    }
    // 如果当前用户的角色是AUTHOR，但是文章的作者不是该用户不能更新
    if (
      article.author.role !== USER_ROLE_MAP.ROOT &&
      user.id !== article.author.id
    ) {
      return {
        result_code: 'has_no_permission',
        message: '只有作者本人能进行修改',
      };
    }
    if (updateArticleDto.banner) {
      article.banner = updateArticleDto.banner;
    }
    const categoriesIds = JSON.parse(updateArticleDto.tags).map(
      (tag: any) => tag.id,
    );
    // 获取与文章关联的分类实例
    const categories = await this.categoryRepository.findBy({
      id: In(categoriesIds),
    });
    article.categories = categories;
    article.title = updateArticleDto.title;
    article.subtitle = updateArticleDto.subtitle;
    article.desc = updateArticleDto.desc;
    article.content = updateArticleDto.content;
    // @ts-ignore
    article.updateTime = new Date();
    // 保存更新后的文章
    const updatedArticle = await this.articleRepository.save(article);
    return { data: { articleId: updatedArticle.id } };
  }

  /** 根据文章id删除文章(更改字段) */
  async deleteArticle(id: number) {
    console.log(id);
    const article = await this.articleRepository.findOne({
      where: { id },
    });
    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    article.isActivated = 0;
    return await this.articleRepository.save(article);
  }
}

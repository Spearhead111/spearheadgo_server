import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { SearchArticleDto } from './dto/search-article.dto';
import { USER_ROLE_MAP } from 'src/constants/common';

@Injectable()
export class ArticleService {
  // 使用InjectRepository装饰器并引入Repository即可使用typeorm的操作
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async create(createArticleDto: CreateArticleDto, user: User) {
    const newArticle = await this.articleRepository.create(createArticleDto);
    newArticle.author = user;
    return await this.articleRepository.save(newArticle);
  }

  /** 查找有效的文章个数 */
  async getArticleCount() {
    return this.articleRepository.count({
      where: { isActivated: 1 },
    });
  }

  /** 查询所有没删除的文章 */
  async getArticleList(searchArticleDto: SearchArticleDto) {
    const { pageNo, pageSize, search } = searchArticleDto;
    const skip = (pageNo - 1) * pageSize;

    const articles = await this.articleRepository
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
      ])
      .where('article.title LIKE :keyword', { keyword: `%${search}%` })
      .orWhere('article.subtitle LIKE :keyword', { keyword: `%${search}%` })
      .orWhere('article.desc LIKE :keyword', { keyword: `%${search}%` })
      .where({ isActivated: 1 }) // 只查没被删除的文章  这个一定是写在前面模糊匹配之后的
      .groupBy('article.id') // 添加 GROUP BY 子句以满足聚合要求
      .orderBy('article.id', 'DESC') // 按文章的id降序(新的在上面)
      .offset(skip)
      .limit(pageSize)
      .getRawMany();

    // 查询文章的类别信息
    const articleIds = articles.map((article) => article.id);
    const articleCategories = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.categories', 'categories')
      .select(['categories'])
      .where('article.id IN (:...ids)', { ids: articleIds })
      .getRawMany();

    // 将类别信息关联到文章对象中
    articles.forEach((article) => {
      // 在这里做一下转换吧 把字符串转数字
      article.comments = Number(article.comments);
      article.likes = Number(article.likes);
      article.categories = articleCategories.filter(
        (category) => category.id === article.id,
      );
    });

    console.log(articles);
    const total = await this.getArticleCount();
    return { data: { total, list: articles } };
  }

  /** 查询文章详情 */
  async getArticleDetail(id: number) {
    const article = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoin('article.articleComments', 'comments')
      .leftJoin('article.articleLikes', 'likes')
      .select(['article.*', 'author.nickname AS author'])
      .addSelect([
        'COUNT(DISTINCT comments.id) AS comments',
        'COUNT(DISTINCT likes.id) AS likes',
      ])
      .where({ id }) // 根据文章的 ID 进行过滤
      .getRawOne();

    article.comments = Number(article.comments);
    article.likes = Number(article.likes);
    console.log(article);
    if (article) {
      return { data: article };
    } else {
      return { result_code: 'article_id_not_found', message: '没找到文章' };
    }
  }

  // 更新文章
  async update(id: number, updateArticleDto: UpdateArticleDto, userId: string) {
    const article = await this.articleRepository.findOne({
      where: { id },
    });
    // 如果当前用户的角色是AUTHOR，但是文章的作者不是该用户不能更新
    if (
      article.author.role !== USER_ROLE_MAP.ROOT &&
      userId !== article.author.id
    ) {
      return {
        result_code: 'has_no_permission',
        message: '只有作者本人能进行修改',
      };
    }
    return `This action updates a #${id} article`;
  }

  /** 根据文章id删除文章(更改字段) */
  async deleteArticle(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id, isActivated: 1 },
    });
    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    article.isActivated = 0;
    return await this.articleRepository.save(article);
  }
}

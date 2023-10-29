import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { SearchArticleDto } from './dto/search-article.dto';

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
      .select([
        'article.id',
        'article.title',
        'article.subtitle',
        'article.banner',
        'article.desc',
        'article.createTime',
        'article.updateTime',
        'article.view',
        'article.comments',
        'article.like',
        'author.nickname',
        'article.authorId AS auth_id',
      ])
      .where('article.title LIKE :keyword', { keyword: `%${search}%` })
      .orWhere('article.subtitle LIKE :keyword', { keyword: `%${search}%` })
      .orWhere('article.desc LIKE :keyword', { keyword: `%${search}%` })
      .where({ isActivated: 1 }) // 只查没被删除的文章  这个一定是写在前面模糊匹配之后的
      .orderBy('article.id', 'DESC') // 按文章的id降序(新的在上面)
      .offset(skip)
      .limit(pageSize)
      .getRawMany();
    console.log(articles);
    const total = await this.getArticleCount();
    return { data: { total, list: articles } };
  }

  /** 查询文章详情 */
  async getArticleDetail(id: number) {
    const article = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .select(['article.*', 'author.nickname AS author'])
      .where({ id }) // 根据文章的 ID 进行过滤
      .getRawOne();
    return { data: article };
  }

  update(id: number, updateArticleDto: UpdateArticleDto) {
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

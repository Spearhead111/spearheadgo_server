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
import { GetAdminArticleDto } from './dto/get-admin-article.dto';
import { GetLatestArticleDto } from './dto/get-latest-article.dto';
import { SendArticleCommentDto } from './dto/send-article-comment.dto';
import { SendArticleCommentReplyDto } from './dto/send-article-comment-reply.dto';
import { ArticleComments } from './entities/articleComments.entity';
import { GetArticleCommentDto } from './dto/get-article-comment.dto';
import { CommentReply } from './entities/comment-reply.entity';

@Injectable()
export class ArticleService {
  // 使用InjectRepository装饰器并引入Repository即可使用typeorm的操作
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    // 要想在别的模块中使用别的repository<实体>必须要在当前模块的imports的TypeOrmModule.forFeature([])中加入这个实体
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ArticleComments)
    private readonly articleCommentsRepository: Repository<ArticleComments>,
    @InjectRepository(CommentReply)
    private readonly commentReplyRepository: Repository<CommentReply>,
  ) {}

  /** 创建文章 */
  async createArticle(
    createArticleDto: CreateArticleDto,
    user: User,
    categoriesIds: number[],
  ) {
    const newArticle = this.articleRepository.create(createArticleDto);
    newArticle.author = user;
    newArticle.updateBy = user;
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
    let query = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.articleComments', 'comments')
      .leftJoinAndSelect('comments.commentReply', 'commentReply')
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
        // 'CAST(COUNT(DISTINCT comments.id) AS SIGNED) AS comments', // 使用 CAST 转换为数字类型 但是没起作用啊 晕
        'CAST(COUNT(DISTINCT likes.id) AS SIGNED) AS likes', // 使用 CAST 转换为数字类型
        'GROUP_CONCAT(categories.id) AS categoriesIds',
      ])
      .where('article.isActivated = :isActivated', { isActivated: 1 }) // 只查没被删除的文章  这个一定是写在前面模糊匹配之后的
      .andWhere(
        '(article.title LIKE :keyword OR article.subtitle LIKE :keyword OR article.description LIKE :keyword)',
        { keyword: `%${search}%` },
      ); // or条件一定要写在一起并且放在一个where里，这不是重点，重点是一定要把or给括号括起来

    if (tagIdList.length) {
      // 如果有标签id 则添加标签查询条件
      query = query
        .andWhere('categories.id IN (:...tagIdList)', { tagIdList })
        .having('COUNT(DISTINCT  categories.id) >= :categoryCount', {
          categoryCount: tagIdList.length,
        });
    }

    query
      .groupBy('article.id') // 添加 GROUP BY 子句以满足聚合要求
      .orderBy('likes', 'DESC') // 先按点赞数降序
      .addOrderBy('article.createTime', 'DESC') // 再按创建时间降序排序
      .offset(skip)
      .limit(pageSize);

    const articles = await query.getRawMany();

    const count = await query.getCount();
    if (!articles?.length) {
      return { data: { list: [], total: 0, has_next: false } };
    }
    // 查询文章的类别信息
    const articleIds = articles.map((article) => article.article_id);
    const categoriesList = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.categories', 'categories')
      .select(['article.id', 'categories'])
      .where('article.id IN (:...ids)', { ids: articleIds })
      .getMany();

    const articleComments = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.articleComments', 'comments')
      .leftJoinAndSelect('comments.commentReply', 'commentReply')
      .where('article.id IN (:...ids)', { ids: articleIds })
      .getMany();

    // 将类别信息关联到文章对象中
    articles.forEach((article) => {
      let comments = 0;
      articleComments
        .find((article_) => article_.id === article.article_id)
        .articleComments.forEach((comment) => {
          comments += comment.commentReply.length + 1;
        });
      article.comments = comments;
      article.likes = Number(article.likes);
      article.categories = categoriesList.find(
        (category) => category.id === article.article_id,
      ).categories;
    });
    return {
      data: {
        has_next: (pageNo - 1) * pageSize + +pageSize < count,
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

    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    const count = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.articleComments', 'comments')
      .leftJoin('article.articleLikes', 'likes')
      .select(['COUNT(DISTINCT likes.id) AS likeCount'])
      .where({ id }) // 根据文章的 ID 进行过滤
      .andWhere({ isActivated: 1 })
      .groupBy('article.id')
      .getRawOne();

    const articleComments = await this.articleCommentsRepository
      .createQueryBuilder('articleComments')
      .leftJoinAndSelect('articleComments.article', 'article')
      .leftJoinAndSelect('articleComments.commentReply', 'commentReply')
      .where('article.id = :id', { id })
      .getMany();
    let commentCount = 0;
    articleComments.forEach((comment) => {
      commentCount += comment.commentReply.length + 1;
    });

    const data = Object.assign(article, {
      commentCount: commentCount,
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
    article.updateBy = user;
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
  async deleteArticle(id: number, user: User) {
    const article = await this.articleRepository.findOne({
      where: { id },
    });
    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    article.isActivated = 0;
    article.updateBy = user;
    return await this.articleRepository.save(article);
  }

  /** 根据文章id上线文章(更改字段) */
  async recoverArticle(id: number, user: User) {
    const article = await this.articleRepository.findOne({
      where: { id },
    });
    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    article.isActivated = 1;
    article.updateBy = user;
    return await this.articleRepository.save(article);
  }

  /** 获取文章列表管理版 */
  async getAdminArticleList(getAdminArticleDto: GetAdminArticleDto) {
    const { pageNo, tagList, pageSize, search, author } = getAdminArticleDto;
    const tagCodeList = tagList ? tagList.split(',') : [];
    const authorIdList = author ? author.split(',') : [];
    const skip = (pageNo - 1) * pageSize;
    let query = this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .leftJoin('article.updateBy', 'updateBy')
      .leftJoin('article.articleLikes', 'likes')
      .leftJoin('article.categories', 'categories')
      .select([
        'article.id AS id',
        'article.title AS title',
        'CAST(COUNT(DISTINCT likes.id) AS SIGNED) AS likes', // 使用 CAST 转换为数字类型
        'author.nickname AS author',
        'updateBy.nickname AS updateBy',
        'article.createTime AS createTime',
        'article.updateTime AS updateTime',
        'article.isActivated AS isActivated',
      ])
      .where('article.title LIKE :keyword', {
        keyword: `%${search}%`,
      })
      .groupBy('article.id');
    // 如果有文章标签的搜索条件
    if (tagCodeList.length > 0) {
      query = query.andWhere('categories.code IN (:...codes)', {
        codes: tagCodeList,
      });
    }
    if (authorIdList.length > 0) {
      query = query.andWhere('author.id IN (:...authorIds)', {
        authorIds: authorIdList,
      });
    }
    // 分页
    query = query.offset(skip).limit(pageSize);
    const total = await query.getCount();
    // 没有查到直接返回空的，避免浪费查询资源
    if (!total) {
      return {
        data: {
          has_next: false,
          list: [],
          total,
        },
      };
    }
    const list = await query.getRawMany();

    // 查询文章的类别信息
    const articleIds = list.map((article) => article.id);
    const categoriesList = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.categories', 'categories')
      .select(['article.id', 'categories'])
      .where('article.id IN (:...ids)', { ids: articleIds })
      .getMany();
    list.forEach((article) => {
      article.likes = Number(article.likes);
      article.createTime = article.createTime.getTime();
      article.updateTime = article.updateTime.getTime();
      // 将查询出来的现成标签信息给文章list
      article.tags = categoriesList.find(
        (category) => category.id === article.id,
      ).categories;
    });

    return {
      data: {
        has_next: (pageNo - 1) * pageSize + pageSize < total,
        list,
        total,
      },
    };
  }

  /** 获取最新发布的文章 */
  async getLatestArticle(getLatestArticleDto: GetLatestArticleDto) {
    const { pageNo, pageSize } = getLatestArticleDto;
    const skip = (pageNo - 1) * pageSize;
    const articles = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .select([
        'article.id AS articleId',
        'article.title AS title',
        'article.createTime AS createTime',
        'author.nickname AS author',
        'author.role AS authorRole',
        'author.avatar AS authorAvatar',
      ])
      .where('article.isActivated = :isActivated', { isActivated: 1 })
      .orderBy('article.createTime', 'DESC')
      .offset(skip)
      .limit(pageSize)
      .getRawMany();

    const categories = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.categories', 'categories')
      .select(['article.id', 'article.createTime', 'categories'])
      .where('article.isActivated = :isActivated', { isActivated: 1 })
      .orderBy('article.createTime', 'DESC')
      .offset(skip)
      .limit(pageSize)
      .getMany();

    console.log(categories);
    articles.forEach((article: any, index: number) => {
      article.createTime = article.createTime.getTime();
      article.tags = categories[index]?.categories || [];
    });
    return { data: articles };
  }

  /** 获取文章评论 */
  async getArticleComment(id: number, query: GetArticleCommentDto) {
    const article = await this.articleRepository.findOne({
      where: { id, isActivated: 1 },
    });
    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    const { pageNo, pageSize } = query;
    const skip = (pageNo - 1) * pageSize;
    const comments = await this.articleCommentsRepository
      .createQueryBuilder('articleComment')
      .leftJoinAndSelect('articleComment.commentBy', 'commentBy')
      .leftJoinAndSelect('articleComment.commentReply', 'commentReply')
      .leftJoinAndSelect('articleComment.commentLikes', 'commentLikes')
      .leftJoinAndSelect('commentReply.commentBy', 'commentReplyCommentBy')
      .leftJoinAndSelect('commentReply.commentLikes', 'commentReplyLikes')
      .leftJoinAndSelect('commentReply.replyToUser', 'replyToUser')
      .where('articleComment.article = :article', { article: id })
      .orderBy('articleComment.createTime', 'DESC')
      .offset(skip)
      .limit(pageSize)
      .getMany();
    let count = 0;
    const commentsRes = comments.map((comment) => {
      let newComment: any = {};
      newComment.id = comment.id;
      // @ts-ignore
      newComment.createTime = comment.createTime.getTime();
      newComment.content = comment.content;
      newComment.commentBy = comment.commentBy.nickname;
      newComment.commentById = comment.commentBy.id;
      newComment.commentByAvatar = comment.commentBy.avatar;
      newComment.commentLikes = comment.commentLikes.length;
      newComment.replyComment = comment.commentReply.map((commentReply) => {
        return {
          ...commentReply,
          // @ts-ignore
          createTime: commentReply.createTime.getTime(),
          commentBy: commentReply.commentBy.nickname,
          commentByAvatar: commentReply.commentBy.avatar,
          commentById: commentReply.commentBy.id,
          commentLikes: commentReply.commentLikes.length,
          replyTo: commentReply.replyToUser.nickname,
        };
      });
      count += comment.commentReply.length + 1;
      return newComment;
    });
    return {
      data: {
        has_next: (pageNo - 1) * pageSize + pageSize < count,
        list: commentsRes,
        total: count,
      },
    };
  }

  /** 发表文章评论 */
  async sendArticleComment(
    sendArticleCommentDto: SendArticleCommentDto,
    user: User,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id: +sendArticleCommentDto.articleId },
    });
    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    const articleComment = this.articleCommentsRepository.create(
      sendArticleCommentDto,
    );
    articleComment.article = article;
    articleComment.commentBy = user;
    return await this.articleCommentsRepository.save(articleComment);
  }

  /** 发表文章评论的回复 */
  async sendArticleCommentReply(
    articleId: number,
    sendArticleCommentReplyDto: SendArticleCommentReplyDto,
    user: User,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id: +articleId },
    });
    if (!article) {
      return { result_code: 'article_id_not_found', message: '文章不存在' };
    }
    // 查看属于的评论存不存在
    const articleComment = await this.articleCommentsRepository.findOne({
      where: { id: +sendArticleCommentReplyDto.belongCommentId },
    });
    if (!articleComment) {
      return { result_code: 'comment_id_not_found', message: '该评论不存在' };
    }
    // 查看回复的评论存不存在
    // 判断下回复的是一级评论还是二级评论
    const commentsRepository = sendArticleCommentReplyDto.isReplyToTop
      ? this.articleCommentsRepository
      : this.commentReplyRepository;
    const replyToComment = await commentsRepository
      .createQueryBuilder('replyToComment')
      .leftJoinAndSelect('replyToComment.commentBy', 'commentBy')
      .where('replyToComment.id = :id', {
        id: +sendArticleCommentReplyDto.replyToCommentId,
      })
      .getOne();
    if (!replyToComment) {
      return { result_code: 'comment_id_not_found', message: '该评论不存在' };
    }

    const articleReplyComment = this.commentReplyRepository.create(
      sendArticleCommentReplyDto,
    );

    articleReplyComment.commentBy = user;
    articleReplyComment.article = article;
    articleReplyComment.belongComment = articleComment;
    articleReplyComment.replyToUser = replyToComment.commentBy;
    articleReplyComment.isReplyToTop = sendArticleCommentReplyDto.isReplyToTop;
    return await this.commentReplyRepository.save(articleReplyComment);
  }
}

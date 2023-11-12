import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Timestamp,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Article } from './article.entity';
import { ArticleComments } from './articleComments.entity';

@Entity()
export class ArticleCommentsLikes {
  @PrimaryGeneratedColumn({ name: 'article_comment_like_id' })
  id: number;

  // 点赞的评论
  @ManyToOne(
    () => ArticleComments,
    (articleComments) => articleComments.commentLikes,
  )
  @JoinColumn({ name: 'comment_id', referencedColumnName: 'id' })
  articleComment: ArticleComments;

  // 与用户的关系，多对一
  @ManyToOne(() => User, (user) => user.commentsLike)
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  user: User;

  // 与文章的关系，多对一
  @ManyToOne(() => Article, (article) => article.articleLikes)
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: Article;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createTime: Timestamp;
}

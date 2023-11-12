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
  OneToMany,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Article } from './article.entity';
import { ArticleCommentsLikes } from './article-comments-like.entity';
import { CommentReply } from './comment-reply.entity';

@Entity()
export class ArticleComments {
  @PrimaryGeneratedColumn({ name: 'comment_id' })
  id: number;

  // 与用户的关系，多对一  评论人
  @ManyToOne(() => User, (user) => user.articleComments)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  commentBy: User;

  // 与文章的关系，多对一
  @ManyToOne(() => Article, (article) => article.articleComments)
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: Article;

  // 评论的点赞数
  @OneToMany(
    () => ArticleCommentsLikes,
    (articleCommentsLikes) => articleCommentsLikes.articleComment,
  )
  commentLikes: ArticleCommentsLikes[];

  // 评论的回复
  @OneToMany(() => CommentReply, (commentReply) => commentReply.belongComment)
  commentReply: CommentReply[];

  @Column({ length: 255 })
  content: string;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createTime: Timestamp;
}

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
  OneToMany,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Article } from './article.entity';
import { ArticleComments } from './articleComments.entity';
import { CommentReplyLike } from './comment-reply-like.entity';

@Entity()
export class CommentReply {
  @PrimaryGeneratedColumn()
  id: number;

  // 与用户的关系，多对一
  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  commentBy: User;

  // 在那一条评论底下，多对一
  @ManyToOne(
    () => ArticleComments,
    (articleComments) => articleComments.commentReply,
  )
  @JoinColumn({ name: 'belong_comment_id', referencedColumnName: 'id' })
  belongComment: ArticleComments;

  // 回复的是哪条评论
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reply_to_user_id', referencedColumnName: 'id' })
  replyToUser: User;

  // 评论回复的点赞
  @OneToMany(
    () => CommentReplyLike,
    (commentReplyLike) => commentReplyLike.articleComment,
    { onDelete: 'CASCADE' },
  )
  commentLikes: CommentReplyLike[];

  /** 0-回复的不是文章一级评论  1-回复的是文章一级评论 */
  @Column({ name: 'is_reply_to_top', default: 1 })
  isReplyToTop: number;

  // 与文章的关系，多对一
  @ManyToOne(() => Article)
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: Article;

  @Column({ length: 255 })
  content: string;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createTime: Timestamp;
}

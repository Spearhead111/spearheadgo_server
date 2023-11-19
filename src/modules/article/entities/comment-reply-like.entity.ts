import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Timestamp,
  JoinColumn,
  Column,
} from 'typeorm';
import { CommentReply } from './comment-reply.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Article } from './article.entity';

@Entity()
export class CommentReplyLike {
  @PrimaryGeneratedColumn({ name: 'comment_reply_like_id' })
  id: number;

  @Column({ default: 0 })
  status: number;

  // 点赞的评论
  @ManyToOne(() => CommentReply, (commentReply) => commentReply.commentLikes)
  @JoinColumn({ name: 'comment_reply_id', referencedColumnName: 'id' })
  articleComment: CommentReply;

  // 与文章的关系，多对一
  @ManyToOne(() => Article)
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: Article;

  // 与用户的关系，多对一
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createTime: Timestamp;
}

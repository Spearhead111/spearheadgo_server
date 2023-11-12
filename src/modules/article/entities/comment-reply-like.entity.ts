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
} from 'typeorm';
import { CommentReply } from './comment-reply.entity';

@Entity()
export class CommentReplyLike {
  @PrimaryGeneratedColumn({ name: 'comment_reply_like_id' })
  id: number;

  // 点赞的评论
  @ManyToOne(() => CommentReply, (commentReply) => commentReply.commentLikes)
  @JoinColumn({ name: 'comment_reply_id', referencedColumnName: 'id' })
  articleComment: CommentReply;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createTime: Timestamp;
}

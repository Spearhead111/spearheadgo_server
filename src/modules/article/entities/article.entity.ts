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
import { Category } from 'src/modules/category/entities/category.entity';
import { ArticleComments } from './articleComments.entity';
import { ArticleLikes } from './articleLike.entity';
import { CommentReply } from './comment-reply.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 15 })
  title: string;

  @Column({ length: 20 })
  subtitle: string;

  @Column({ name: 'description', length: 100 })
  desc: string;

  @Column()
  banner: string;

  @Column('text')
  content: string;

  // 与评论的关系
  @OneToMany(
    () => ArticleComments,
    (articleComments) => articleComments.article,
    { onDelete: 'CASCADE' },
  )
  articleComments: ArticleComments[];

  // 与点赞的关系
  @OneToMany(() => ArticleLikes, (articleLikes) => articleLikes.article, {
    onDelete: 'CASCADE',
  })
  articleLikes: ArticleLikes[];

  // // 与【回复评论】的关系
  // @OneToMany(() => CommentReply, (commentReply) => commentReply.article ,{ onDelete: 'CASCADE' })
  // commentReply: CommentReply[];

  @ManyToOne(() => User, (user) => user.articles, { eager: true })
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  author: User;

  @ManyToOne(() => User, { eager: true })
  updateBy: User;

  @ManyToMany(() => Category, (category) => category.articles)
  @JoinTable({
    name: 'article_category', // 指定中间关联表的名称
    joinColumn: { name: 'article_id', referencedColumnName: 'id' }, // 指定外键和参考列
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
  })
  createTime: Timestamp;

  @UpdateDateColumn({
    name: 'update_time',
    type: 'timestamp',
  })
  updateTime: Timestamp;

  @Column({ type: 'tinyint', default: 1 })
  isActivated: number;
}

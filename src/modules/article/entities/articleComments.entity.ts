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
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Article } from './article.entity';

@Entity()
export class ArticleComments {
  @PrimaryGeneratedColumn()
  id: number;

  // 与用户的关系，多对一
  @ManyToOne(() => User, (user) => user.articleComments)
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  user: User;

  // 与文章的关系，多对一
  @ManyToOne(() => Article, (article) => article.articleComments)
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: Article;

  @Column({ length: 255 })
  content: string;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
  })
  createTime: Timestamp;
}

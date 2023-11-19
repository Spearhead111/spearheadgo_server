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

@Entity()
export class ArticleLikes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  status: number;

  // 与用户的关系，多对一
  @ManyToOne(() => User, (user) => user.articleLikes)
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

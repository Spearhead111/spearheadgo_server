import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  OneToMany,
  Timestamp,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Article } from 'src/modules/article/entities/article.entity';
import { ArticleComments } from 'src/modules/article/entities/articleComments.entity';
import { ArticleLikes } from 'src/modules/article/entities/articleLike.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  username: string; // 用户名

  @Column({ length: 20 })
  nickname: string; // 昵称

  @Column()
  email: string;

  @Exclude()
  @Column({ select: false })
  password: string;

  @Column({ default: '' })
  avatar: string;

  @Column('simple-enum', {
    enum: ['root', 'admin', 'author', 'visitor'],
    default: 'visitor',
  })
  role: string; // 用户角色

  // 用来指代用户是否删除
  @Column({ type: 'tinyint', default: 1 })
  isActivated: number;

  @Column({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Timestamp;

  @Column({
    name: 'update_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateTime: Timestamp;

  // 建立反向关系，表示一个用户可以有多篇文章
  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  // 与评论的关系
  @OneToMany(() => ArticleComments, (articleComments) => articleComments.user)
  articleComments: ArticleComments[];

  // 与点赞的关系
  @OneToMany(() => ArticleLikes, (articleLikes) => articleLikes.user)
  articleLikes: ArticleLikes[];

  @BeforeInsert()
  async encryptPwd() {
    this.password = bcrypt.hashSync(this.password);
    this.nickname = this.username;
  }
}

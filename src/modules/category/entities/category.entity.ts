// category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Article } from 'src/modules/article/entities/article.entity'; // 引入 Article 实体

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 10 })
  label: string;

  @Column({ length: 10 })
  color: string;

  @Column({ length: 50 })
  icon: string;

  @Column({ name: 'icon_color', length: 10 })
  iconColor: string;

  // 定义多对多关系，一个分类可以包含多篇文章
  @ManyToMany(() => Article, (article) => article.categories)
  articles: Article[];
}

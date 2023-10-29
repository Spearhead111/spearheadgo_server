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
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Category } from 'src/modules/category/entities/category.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 15 })
  title: string;

  @Column({ length: 20 })
  subtitle: string;

  @Column({ name: 'description', length: 20 })
  desc: string;

  @Column()
  banner: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User, (user) => user.articles)
  author: User;

  @ManyToMany(() => Category, (category) => category.articles)
  @JoinTable()
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

  @Column({ type: 'int', default: 0 })
  view: number;

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  like: number;

  @Column({ type: 'tinyint', default: 1 })
  isActivated: number;
}

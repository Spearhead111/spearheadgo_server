import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ArticleComments } from './entities/articleComments.entity';
import { ArticleLikes } from './entities/articleLike.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, ArticleComments, ArticleLikes]),
    UserModule,
    AuthModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}

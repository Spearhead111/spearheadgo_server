import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ArticleComments } from './entities/articleComments.entity';
import { ArticleLikes } from './entities/articleLike.entity';
import { FileService } from 'src/services/upload.service';
import { CategoryModule } from '../category/category.module';
import { Category } from '../category/entities/category.entity';
import { ArticleCommentsLikes } from './entities/article-comments-like.entity';
import { CommentReply } from './entities/comment-reply.entity';
import { CommentReplyLike } from './entities/comment-reply-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      ArticleComments,
      ArticleLikes,
      Category,
      ArticleCommentsLikes,
      CommentReply,
      CommentReplyLike,
    ]),
    UserModule,
    AuthModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService, FileService],
})
export class ArticleModule {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateArticleDto, CreateArticleOriginDto } from './create-article.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateArticleDto extends PartialType(CreateArticleOriginDto) {}

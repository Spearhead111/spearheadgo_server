import { IsString, IsNotEmpty, IsArray, IsNumber } from 'class-validator';
import { Column } from 'typeorm';

export class SearchArticleDto {
  @IsString()
  search: string;

  @Column({ default: 1 })
  @IsNumber()
  @IsNotEmpty()
  pageNo: number;

  @Column({ default: 6 })
  @IsNumber()
  @IsNotEmpty()
  pageSize: number;
}

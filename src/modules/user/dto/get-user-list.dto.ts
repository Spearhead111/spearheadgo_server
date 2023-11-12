import { IsNumber, IsString } from 'class-validator';

export class GetUserListDto {
  @IsString()
  search: string; // 用户账号或者昵称

  @IsString()
  role: string; // 用户角色

  @IsNumber()
  status: number; // -1:查询全部 0:删除/注销用户  1:正常用户

  @IsNumber()
  pageNo: number;

  @IsNumber()
  pageSize: number;
}

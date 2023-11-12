import { IsNumber, IsString } from 'class-validator';

export class ChangeUserStatusDto {
  @IsString()
  id: string; // 更改状态的用户的id

  @IsNumber()
  isActivated: number; // 需要更改的状态
}

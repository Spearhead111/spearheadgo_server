import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  id: string
  avatar?: string;
  email?: string;
  role?: string;
  nickname?: string;
}

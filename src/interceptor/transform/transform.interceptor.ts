import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// 统一成功响应的数据结构
export interface SuccessResponse<T> {
  result_code: string;
  message: string;
  data: T;
}

// 统一错误响应的数据结构
export interface ErrorResponse {
  result_code: string;
  message: string;
}

// 统一分页响应的数据结构
export interface PaginatedResponse<T> {
  result_code: string;
  message: string;
  data: {
    list: T[];
    total: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        result_code: data?.result_code || 'sucess',
        message: data?.message || 'success',
        data: data.data,
      })),
    );
  }
}

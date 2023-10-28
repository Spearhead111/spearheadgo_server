import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { HttpExceptionFilter } from './filters/http-exception/http-exception.filter';
import { TransformInterceptor } from './interceptor/transform/transform.interceptor';
import rateLimit from 'express-rate-limit';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 全局注册成功的过滤器
  app.useGlobalInterceptors(new TransformInterceptor());
  // 全局注册错误的过滤器
  // app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 限制15分钟内最多只能访问1000次
    }),
  );

  const origins = JSON.parse(process.env.LSC_CORS_ORIGIN);

  // 启用 CORS，允许来自任何源的请求
  app.use(cors({ origin: origins, credentials: true }));
  await app.listen(3000);
}
bootstrap();

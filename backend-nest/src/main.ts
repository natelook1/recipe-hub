import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(require('express').json({ limit: '10mb' }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://paper-publication-portal.vercel.app',
    'https://paperpublication.vercel.app',
  ];

  // Add production frontend URL from environment
  const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '');
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
    console.log('✅ Added FRONTEND_URL to CORS:', frontendUrl);
  } else {
    console.log('⚠️  FRONTEND_URL not set in environment');
  }

  console.log('🔒 CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('College Publications API')
    .setDescription('API for managing and searching academic publications')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

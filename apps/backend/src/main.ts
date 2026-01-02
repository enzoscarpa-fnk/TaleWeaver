import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const session = require('express-session');

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Configuration des cookies
    app.use(cookieParser());

    // Configuration des sessions (pour utilisation future)
    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'taleweaver-secret-key-change-in-production',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax',
            },
        })
    );

    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        })
    );

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`✅ Application is running on: http://localhost:${port}`);
}
bootstrap();

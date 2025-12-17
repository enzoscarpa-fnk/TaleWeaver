import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { OpenRouterModule } from './openrouter/openrouter.module';
import { ConversationsModule } from './conversations/conversations.module';
import { CharactersModule } from './characters/characters.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        OpenRouterModule,
        ConversationsModule,
        CharactersModule,
    ],
})
export class AppModule {}

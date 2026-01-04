import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { OpenRouterModule } from './openrouter/openrouter.module';
import { ConversationsModule } from './conversations/conversations.module';
import { CharactersModule } from './characters/characters.module';
import { ChatModule } from './chat/chat.module';
import { EmbeddingsModule } from "./embeddings/embeddings.module";
import { GameStateModule } from './game-state/game-state.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

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
        ChatModule,
        EmbeddingsModule,
        GameStateModule,
        AuthModule,
        AdminModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}

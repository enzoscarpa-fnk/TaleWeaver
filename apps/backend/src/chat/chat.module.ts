import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CharactersModule } from '../characters/characters.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { GameStateModule } from '../game-state/game-state.module';

@Module({
    imports: [CharactersModule, PrismaModule, OpenRouterModule, EmbeddingsModule, GameStateModule],
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule {}
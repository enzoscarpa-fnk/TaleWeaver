import { Module } from '@nestjs/common';
import { GameStateService } from './game-state.service';
import { GameStateController } from './game-state.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
    imports: [PrismaModule, EmbeddingsModule],
    controllers: [GameStateController],
    providers: [GameStateService],
    exports: [GameStateService],
})
export class GameStateModule {}
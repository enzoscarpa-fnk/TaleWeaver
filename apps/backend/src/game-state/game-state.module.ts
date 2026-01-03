import { Module } from '@nestjs/common';
import { GameStateService } from './game-state.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
    imports: [PrismaModule, EmbeddingsModule],
    providers: [GameStateService],
    exports: [GameStateService],
})
export class GameStateModule {}
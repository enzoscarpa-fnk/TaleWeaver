import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { CharacterCreationController } from './character-creation.controller';
import { CharacterCreationService } from './character-creation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenRouterModule } from '../openrouter/openrouter.module';

@Module({
    imports: [PrismaModule, OpenRouterModule],
    controllers: [CharactersController, CharacterCreationController],
    providers: [CharactersService, CharacterCreationService],
})
export class CharactersModule {}

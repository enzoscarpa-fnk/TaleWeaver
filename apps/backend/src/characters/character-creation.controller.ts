import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CharacterCreationService } from './character-creation.service';

interface CreationStepDto {
    sessionId: string;
    currentStep: string;
    userMessage: string;
    accumulatedData?: any;
}

@Controller('characters/creation')
export class CharacterCreationController {
    constructor(private creationService: CharacterCreationService) {}

    @Post('step')
    async processStep(@Body() dto: CreationStepDto) {
        return this.creationService.processCreationStep(
            dto.sessionId,
            dto.userMessage,
            {
                step: dto.currentStep as any,
                prompt: '',
                data: dto.accumulatedData,
            },
        );
    }

    @Post('finalize')
    async finalize(@Body() characterData: any) {
        return this.creationService.finalizeCharacter(characterData);
    }
}

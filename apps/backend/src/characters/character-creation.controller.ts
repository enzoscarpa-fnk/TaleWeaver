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
        // Si on arrive sur le step 'complete', finalise automatiquement
        if (dto.currentStep === 'complete') {
            console.log('🎉 Step is complete, auto-finalizing character');

            try {
                const character = await this.creationService.finalizeCharacter(dto.accumulatedData);

                return {
                    aiMessage: `🎉 Félicitations ${dto.accumulatedData.name} ! Ton personnage ${dto.accumulatedData.class} est prêt pour l'aventure !\n\n⚔️ Force: ${dto.accumulatedData.strength}\n🧠 Intelligence: ${dto.accumulatedData.intelligence}\n⚡ Agilité: ${dto.accumulatedData.agility}\n\nQue les mers te soient favorables ! 🏴‍☠️`,
                    nextStep: 'complete',
                    character,
                    extractedData: {},
                };
            } catch (error) {
                console.error('❌ Finalization error:', error);
                throw error;
            }
        }

        // Sinon, traite le step normalement
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

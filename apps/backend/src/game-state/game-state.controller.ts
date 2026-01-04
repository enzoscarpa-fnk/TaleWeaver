import { Controller, Get, Param } from '@nestjs/common';
import { GameStateService } from './game-state.service';

@Controller('api/game-state')
export class GameStateController {
    constructor(private gameStateService: GameStateService) {}

    @Get(':sessionId')
    async getGameState(@Param('sessionId') sessionId: string) {
        try {
            const context = await this.gameStateService.getGameContext(sessionId);

            return {
                currentLocation: context.session.currentLocation,
                gold: context.session.gold,
                reputation: context.session.reputation,
                activeQuests: context.activeQuests.map(q => ({
                    name: q.name,
                    description: q.description,
                    objectives: JSON.parse(q.objectives),
                })),
                combat: context.combat,
            };
        } catch (error) {
            return {
                currentLocation: 'Port de Tortuga',
                gold: 0,
                reputation: 0,
                activeQuests: [],
                combat: null,
            };
        }
    }
}

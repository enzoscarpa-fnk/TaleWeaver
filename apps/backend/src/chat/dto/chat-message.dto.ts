export class ChatMessageDto {
    sessionId: string;
    message: string;
    context?: GameContext;
}

export type GameContext =
    | { type: 'idle' }
    | { type: 'character-creation'; step: string; data?: any }
    | { type: 'exploration'; location?: string }
    | { type: 'combat'; enemyId?: string };
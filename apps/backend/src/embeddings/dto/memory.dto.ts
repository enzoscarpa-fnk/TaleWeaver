import { IsString, IsEnum, IsOptional, IsObject, IsInt, Min, Max } from 'class-validator';

export enum MemoryType {
    NARRATIVE = 'NARRATIVE',
    NPC_INTERACTION = 'NPC_INTERACTION',
    PLAYER_ACTION = 'PLAYER_ACTION',
}

export class CreateMemoryDto {
    @IsString()
    sessionId: string;

    @IsEnum(MemoryType)
    type: MemoryType;

    @IsString()
    content: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export class SearchMemoriesDto {
    @IsString()
    sessionId: string;

    @IsString()
    query: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(20)
    topK?: number = 5;
}
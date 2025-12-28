import { IsString, IsOptional, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateCharacterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    class: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    level?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    experience?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    health?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxHealth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    mana?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    maxMana?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    strength?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    intelligence?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    agility?: number;

    @IsOptional()
    @IsString()
    backstory?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}

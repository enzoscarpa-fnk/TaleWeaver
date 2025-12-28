import { IsArray, IsString, IsIn, ValidateNested, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class MessageDto {
    @IsString()
    @IsIn(['system', 'user', 'assistant'])
    role: 'system' | 'user' | 'assistant';

    @IsString()
    content: string;
}

export class ChatCompletionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MessageDto)
    messages: MessageDto[];

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    sessionId?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(2)
    temperature?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    max_tokens?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(2)
    top_p?: number;

    @IsOptional()
    @IsNumber()
    @Min(-2)
    @Max(2)
    frequency_penalty?: number;

    @IsOptional()
    @IsNumber()
    @Min(-2)
    @Max(2)
    presence_penalty?: number;
}

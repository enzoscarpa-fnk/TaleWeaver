import { IsArray, IsString, IsIn, ValidateNested, IsOptional } from 'class-validator';
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
}
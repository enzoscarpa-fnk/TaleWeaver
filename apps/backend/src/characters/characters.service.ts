import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Injectable()
export class CharactersService {
    constructor(private prisma: PrismaService) {}

    async create(createCharacterDto: CreateCharacterDto) {
        return this.prisma.character.create({
            data: {
                name: createCharacterDto.name,
                class: createCharacterDto.class,
                ...(createCharacterDto.backstory && { backstory: createCharacterDto.backstory }),
                ...(createCharacterDto.avatar && { avatar: createCharacterDto.avatar }),
            },
        });
    }


    async findAll() {
        return this.prisma.character.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const character = await this.prisma.character.findUnique({
            where: { id },
        });

        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }

        return character;
    }

    async update(id: string, updateCharacterDto: UpdateCharacterDto) {
        // Vérifie d'abord que le personnage existe
        await this.findOne(id);

        return this.prisma.character.update({
            where: { id },
            data: updateCharacterDto,
        });
    }

    async delete(id: string) {
        // Vérifie d'abord que le personnage existe
        await this.findOne(id);

        return this.prisma.character.delete({
            where: { id },
        });
    }

    async levelUp(id: string) {
        const character = await this.findOne(id);

        return this.prisma.character.update({
            where: { id },
            data: {
                level: character.level + 1,
                strength: character.strength + 5,
                intelligence: character.intelligence + 3,
                agility: character.agility + 2,
                maxHealth: character.maxHealth + 10,
                maxMana: character.maxMana + 5,
            },
        });
    }
}

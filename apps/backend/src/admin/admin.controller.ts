import { Controller, Get, Patch, Delete, Param, Body, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) {}

    @Get()
    async getAllUsers(): Promise<UserResponseDto[]> {
        return this.adminService.getAllUsers();
    }

    @Get(':id')
    async getUserById(@Param('id') id: string): Promise<UserResponseDto | null> {
        return this.adminService.getUserById(id);
    }

    @Patch(':id/role')
    async updateUserRole(@Param('id') id: string, @Body() body: { role: 'USER' | 'ADMIN' }) {
        return this.adminService.updateUserRole(id, body.role);
    }

    @Delete(':id')
    async deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    @Post(':id/reset-password')
    async resetUserPassword(@Param('id') id: string, @Body() resetPasswordDto: ResetPasswordDto) {
        await this.adminService.resetUserPassword(id, resetPasswordDto);
        return { message: 'Mot de passe réinitialisé avec succès' };
    }
}


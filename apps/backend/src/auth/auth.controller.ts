import { Controller, Post, Body, Res, UseGuards, Get, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
        const user = await this.authService.signup(signupDto);
        
        // Créer une session pour l'utilisateur
        const token = await this.authService.createSession(user.id);

        // Définir le cookie (session invité - se supprime à la fermeture du navigateur)
        res.cookie('sessionToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            // Pas de maxAge pour que le cookie soit une session (supprimé à la fermeture du navigateur)
        });

        return res.json({ user });
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Req() req: Request, @Res() res: Response) {
        const user = req.user as any;
        
        // Créer une session pour l'utilisateur
        const token = await this.authService.createSession(user.id);

        // Définir le cookie (session invité - se supprime à la fermeture du navigateur)
        res.cookie('sessionToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            // Pas de maxAge pour que le cookie soit une session (supprimé à la fermeture du navigateur)
        });

        return res.json({ user });
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMe(@Req() req: Request) {
        return { user: req.user };
    }

    @Post('logout')
    async logout(@Req() req: Request, @Res() res: Response) {
        const token = req.cookies?.sessionToken;
        
        if (token) {
            await this.authService.deleteSession(token);
        }

        res.clearCookie('sessionToken');
        return res.json({ message: 'Déconnexion réussie' });
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto) {
        const user = req.user as any;
        await this.authService.changePassword(user.id, changePasswordDto);
        return { message: 'Mot de passe modifié avec succès' };
    }
}


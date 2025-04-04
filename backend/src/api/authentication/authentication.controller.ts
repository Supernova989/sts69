import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { User } from '../../entities/user';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { AppCookie } from '../../shared/types/app-cookie';
import { AuthenticationService } from './authentication.service';
import { AuthGetPublicKeyDto } from './dto/auth-get-public-key.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Public()
  @Post('register')
  register(@Body() body: AuthRegisterDto) {
    const { email, lastname, password, firstname } = body;
    return this.authenticationService.register({ email, lastname, password, firstname });
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Res() response: Response, @CurrentUser() user: User) {
    return this.authenticationService.login({ user, response });
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() request: Request, @Res() response: Response) {
    const refreshToken = request.cookies[AppCookie.REFRESH_TOKEN] as string | undefined;
    return this.authenticationService.refreshLogin({ refreshToken, response });
  }

  @Public()
  @Get('public-key/:bits')
  getPublicKey(@Param() dto: AuthGetPublicKeyDto) {
    return this.authenticationService.getPublicKey(dto.bits);
  }

  @Post('logout')
  logout(@Res() response: Response) {
    response.clearCookie(AppCookie.ACCESS_TOKEN);
    response.clearCookie(AppCookie.REFRESH_TOKEN);
    response.status(HttpStatus.NO_CONTENT).send();
  }
}

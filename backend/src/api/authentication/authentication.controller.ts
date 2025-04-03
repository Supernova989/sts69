import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { User } from '../../entities/user';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { AuthenticationService } from './authentication.service';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  register(@Body() body: AuthRegisterDto) {
    const { email, lastname, password, firstname } = body;
    return this.authenticationService.register({ email, lastname, password, firstname });
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@CurrentUser() user: User) {
    return this.authenticationService.login(user);
  }
}

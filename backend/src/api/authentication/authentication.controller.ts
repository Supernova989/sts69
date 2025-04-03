import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Controller()
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post()
  register(@Body() body: AuthRegisterDto) {
    const { email, lastname, password, firstname } = body;
    return this.authenticationService.register({ email, lastname, password, firstname });
  }
}

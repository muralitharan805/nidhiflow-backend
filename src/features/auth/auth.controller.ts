import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, AuthTokenResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login & JWT Token Exchange' })
  @ApiResponse({ status: 200, description: 'Login successful, JWT token issued' })
  login(@Body() loginDto: LoginDto): Promise<AuthTokenResult> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Self-service User Registration' })
  @ApiResponse({ status: 201, description: 'User account registered successfully' })
  register(@Body() registerDto: RegisterDto): Promise<AuthTokenResult> {
    return this.authService.register(registerDto);
  }
}

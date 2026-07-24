import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'murali@nidhiflow.io', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ example: 'UserP@ss123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}

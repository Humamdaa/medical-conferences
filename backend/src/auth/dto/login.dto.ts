
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'ahmad@example.com',
        format: 'email',
    })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({
        example: 'StrongPass123!',
        format: 'password',
    })
    @IsString()
    @IsNotEmpty()
    password!: string;
}

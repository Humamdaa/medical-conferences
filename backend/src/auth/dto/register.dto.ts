
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
    Matches,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'Ahmad',
        maxLength: 20,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    firstName: string;

    @ApiProperty({
        example: 'Ali',
        maxLength: 20,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    lastName: string;

    @ApiProperty({
        example: 'ahmad@example.com',
        format: 'email',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'StrongPass123!',
        minLength: 8,
        maxLength: 128,
        format: 'password',
        description:
            'Must contain uppercase, lowercase, number and special character',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
    })
    @Matches(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
    })
    @Matches(/[0-9]/, {
        message: 'Password must contain at least one number',
    })
    @Matches(/[^A-Za-z0-9]/, {
        message: 'Password must contain at least one special character',
    })
    password: string;
}

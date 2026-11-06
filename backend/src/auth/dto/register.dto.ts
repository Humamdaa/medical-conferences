
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsEnum,
    IsOptional,
    MaxLength,
    MinLength,
    Matches,
} from 'class-validator';

import { Nationality } from '../../generated/prisma/enums';

export class RegisterDto {
    @ApiProperty({ example: 'Ahmad', maxLength: 20 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    firstName: string;

    @ApiProperty({ example: 'Ali', maxLength: 20 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    lastName: string;

    @ApiProperty({ example: 'ahmad@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'StrongPass123!',
        minLength: 8,
        maxLength: 128,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/[A-Z]/)
    @Matches(/[a-z]/)
    @Matches(/[0-9]/)
    @Matches(/[^A-Za-z0-9]/)
    password: string;

    // New requirements: nationality and identification

    @ApiProperty({
        enum: Nationality,
        example: Nationality.SYRIAN,
    })
    @IsEnum(Nationality)
    nationality: Nationality;

    @ApiPropertyOptional({ example: '12345678901' })
    @IsOptional()
    @IsString()
    nationalId?: string | null;

    @ApiPropertyOptional({ example: 'AB123456' })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    passportNumber?: string | null;

    @ApiPropertyOptional({ example: '123456789' })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    palestinianId?: string | null;
}

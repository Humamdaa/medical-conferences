
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateSpecialistDto {
    @ApiProperty({
        example: 'Cardiology',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'Diagnosis and treatment of heart diseases',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    description?: string | null;
}

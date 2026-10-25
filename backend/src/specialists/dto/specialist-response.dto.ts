
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpecialistResponseDto {
    @ApiProperty({ example: '1', type: String })
    id: string;

    @ApiProperty({ example: 'Cardiology' })
    name: string;

    @ApiPropertyOptional({
        example: 'Diagnosis and treatment of heart diseases',
        nullable: true,
    })
    description: string | null;

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt: string;

    @ApiProperty({ type: String, format: 'date-time' })
    updatedAt: string;
}

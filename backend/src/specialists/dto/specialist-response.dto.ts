
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

}

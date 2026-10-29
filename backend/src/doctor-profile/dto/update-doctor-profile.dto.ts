import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: 'Ahmad' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @IsNotEmpty() @MaxLength(20)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Hassan' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @IsNotEmpty() @MaxLength(20)
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: '1' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @Matches(/^[1-9]\d*$/)
  specialistId?: string;

  @ApiPropertyOptional({ example: 'Damascus' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @IsNotEmpty()
  residence?: string;

  @ApiPropertyOptional({ example: 'Central Clinic, Floor 2' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @IsNotEmpty()
  clinicAddress?: string;


  @ApiPropertyOptional({ example: '2020-07-15', description: 'YYYY-MM-DD' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  certificateIssuedAt?: string;


  @ApiPropertyOptional({ example: 'Mohammad' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @IsNotEmpty()
  fatherName?: string;


  @ApiPropertyOptional({ example: '963995215057', maxLength: 12 })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(12, {
    message: 'Phone number cannot exceed 12 digits',
  })
  @Matches(/^[0-9]+$/, {
    message: 'Phone number must contain digits only',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, {
    message: 'National ID must contain digits only',
  })
  nationalId?: string;

  @ApiPropertyOptional({ example: '12345' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, {
    message: 'Certificate number must contain digits only',
  })
  certificateNumber?: string;

}

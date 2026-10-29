import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsString, Matches, MaxLength, MinLength, ValidateBy, ValidateIf } from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const IsPastDate = ValidateBy({
  name: 'isPastDate',
  validator: {
    validate(value: unknown) {
      if (typeof value !== 'string') return false;

      const today = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Damascus',
      }).format(new Date());

      return value < today;
    },
    defaultMessage: () =>
      'Certificate issue date must be before today',
  },
});

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


  @ApiPropertyOptional({
    example: '2020-07-15',
    description: 'YYYY-MM-DD, must be before today',
  })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  @IsPastDate
  certificateIssuedAt?: string;


  @ApiPropertyOptional({ example: 'Mohammad' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString() @IsNotEmpty()
  fatherName?: string;


  @ApiPropertyOptional({ example: '963111111111' })
  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^963[0-9]{9}$/, {
    message: 'Phone number must start with 963 and contain exactly 12 digits',
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

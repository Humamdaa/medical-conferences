import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt, IsISO8601, IsNumber, IsObject, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength, ValidateBy,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateActivityDto {
  @ApiProperty({ example: 'Medical workshop', maxLength: 200 })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Workshop', maxLength: 100, description: 'Activity type is currently free text.' })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100)
  activityType: string;

  @ApiProperty({ example: '2027-01-10T09:00:00+03:00', format: 'date-time' })
  @IsISO8601({ strict: true }) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  startAt: string;

  @ApiProperty({ example: '2027-01-10T12:00:00+03:00', format: 'date-time', description: 'Must be later than startAt.' })
  @IsISO8601({ strict: true }) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  @ValidateBy({ name: 'endAfterStart', validator: {
    validate: (value, args) => typeof value === 'string' && new Date(value).getTime() > new Date((args!.object as CreateActivityDto).startAt).getTime(),
    defaultMessage: () => 'endAt must be later than startAt',
  } })
  endAt: string;

  @ApiProperty({ example: 'Damascus', maxLength: 200 })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(200)
  location: string;

  @ApiProperty({ example: 'Medical institution', maxLength: 200 })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(200)
  institution: string;

  @ApiProperty({ example: 'Clinical education workshop.', maxLength: 10000 })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(10000)
  description: string;

  @ApiProperty({ example: 5, minimum: 0, maximum: 2147483647 })
  @IsInt() @Min(0) @Max(2147483647)
  points: number;

  @ApiPropertyOptional({ example: 33.5138, minimum: -90, maximum: 90, nullable: true })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 7 }) @Min(-90) @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({ example: 36.2765, minimum: -180, maximum: 180, nullable: true })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 7 }) @Min(-180) @Max(180)
  longitude?: number | null;

  @ApiProperty({ type: String, example: '1', description: 'Existing Specialist ID from GET /specialists.' })
  @IsString() @Matches(/^[1-9]\d*$/) @MaxLength(19)
  @ValidateBy({ name: 'databaseId', validator: { validate: (value) => typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n } })
  specialistId: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 2147483647, description: 'Use the current version from GET /activity-form-template.' })
  @IsInt() @Min(1) @Max(2147483647)
  expectedFormVersion: number;

  @ApiProperty({ type: Object, example: {}, description: 'Values matching the published schema. {} is valid for an empty schema; include all required dynamic values otherwise. Required checkboxes must be true.' })
  @IsObject()
  customFields: Record<string, unknown>;
}

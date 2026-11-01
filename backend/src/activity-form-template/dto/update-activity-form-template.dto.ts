import { IsDefined, IsInt, Max, Min, Validate } from 'class-validator';
import { FormSchemaConstraint } from '../form-schema.validator';
import { ApiProperty } from '@nestjs/swagger';
import { formDefinitionSchema } from '../activity-form-template.swagger';

export class UpdateActivityFormTemplateDto {
  @ApiProperty({
    type: 'integer', minimum: 1, maximum: 2147483646, example: 1,
    description: 'Use the current version from GET; 1 is illustrative. A stale version returns 409.',
  })
  @IsInt()
  @Min(1)
  @Max(2147483646) // Leave room for the PostgreSQL INTEGER increment.
  expectedVersion: number;

  @ApiProperty({
    type: Object, required: true,
    description: formDefinitionSchema.description,
    allOf: [formDefinitionSchema],
    example: formDefinitionSchema.example,
  })
  @IsDefined()
  @Validate(FormSchemaConstraint)
  fieldsSchema: unknown;
}

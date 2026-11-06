import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject, ResponseObject, SchemaObject } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { ActivityFormTemplateController } from './activity-form-template.controller';
import { ActivityFormTemplateService } from './activity-form-template.service';
import { UpdateActivityFormTemplateDto } from './dto/update-activity-form-template.dto';
import { FIELD_TYPES, FORM_LIMITS, formSchemaErrors } from './form-schema.validator';

describe('Activity form template OpenAPI documentation', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    // Only the controller is mounted. No AppModule, dotenv, Prisma or socket.
    const module = await Test.createTestingModule({
      controllers: [ActivityFormTemplateController],
      providers: [{ provide: ActivityFormTemplateService, useValue: {} }],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .overrideGuard(SessionAuthGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    const config = new DocumentBuilder().addCookieAuth('medical.sid', { type: 'apiKey', in: 'cookie' }, 'medical.sid').build();
    document = SwaggerModule.createDocument(app, config);
  });
  afterAll(async () => { await app?.close(); });

  it('publishes the actual DTO with both required properties and runtime bounds', () => {
    const dto = document.components!.schemas!.UpdateActivityFormTemplateDto as SchemaObject;
    expect(dto.required).toEqual(expect.arrayContaining(['expectedVersion', 'fieldsSchema']));
    expect(dto.properties!.expectedVersion).toMatchObject({ type: 'integer', minimum: 1, maximum: 2147483646 });
    const definition = (dto.properties!.fieldsSchema as SchemaObject).allOf![0] as SchemaObject;
    expect(definition.required).toEqual(['fields']);
    const fields = definition.properties!.fields as SchemaObject;
    expect(fields).toMatchObject({ minItems: 0, maxItems: FORM_LIMITS.fields });
    expect((fields.items as SchemaObject).properties!.type).toEqual({ type: 'string', enum: [...FIELD_TYPES] });
  });

  it('provides editable request examples accepted by the real validation pipe', async () => {
    const put = document.paths['/activity-form-template'].put!;
    const body = put.requestBody as { content: { 'application/json': { schema: unknown; examples: Record<string, { value: unknown }> } } };
    expect(body.content['application/json'].schema).toEqual({ $ref: '#/components/schemas/UpdateActivityFormTemplateDto' });
    expect(Object.keys(body.content['application/json'].examples)).toEqual(['default']);
    expect(body.content['application/json'].examples.default.value).toMatchObject({ expectedVersion: 1 });
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    for (const example of Object.values(body.content['application/json'].examples)) {
      await expect(pipe.transform(example.value, { type: 'body', metatype: UpdateActivityFormTemplateDto })).resolves.toBeInstanceOf(UpdateActivityFormTemplateDto);
    }
  });

  it('documents cookie security, success examples and appropriate error statuses', () => {
    expect(document.components!.securitySchemes!['medical.sid']).toMatchObject({ type: 'apiKey', in: 'cookie', name: 'medical.sid' });
    const path = document.paths['/activity-form-template'];
    for (const operation of [path.get!, path.put!]) {
      expect(operation.security).toContainEqual({ 'medical.sid': [] });
      for (const status of ['200', '401', '403', '503']) expect(operation.responses[status]).toBeDefined();
      const response = operation.responses['200'] as ResponseObject;
      const schema = response.content!['application/json'].schema as SchemaObject;
      expect(formSchemaErrors(schema.example.fieldsSchema)).toEqual([]);
    }
    expect(path.put!.responses['400']).toBeDefined();
    expect(path.put!.responses['409']).toBeDefined();
    expect(path.get!.responses['409']).toBeUndefined();
  });
});

import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { UpdateActivityFormTemplateDto } from './dto/update-activity-form-template.dto';
import { formSchemaErrors } from './form-schema.validator';

export const SHARED_TEMPLATE_KEY = 'shared-activity';
const select = {
  id: true, templateKey: true, version: true, supervisorId: true,
  formName: true, fieldsSchema: true, createdAt: true, updatedAt: true,
} satisfies Prisma.ActivityFormConfigSelect;
type Template = Prisma.ActivityFormConfigGetPayload<{ select: typeof select }>;

@Injectable()
export class ActivityFormTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  private response(template: Template) {
    return { ...template, id: template.id.toString(), supervisorId: template.supervisorId.toString() };
  }

  async get() {
    const template = await this.prisma.activityFormConfig.findUnique({
      where: { templateKey: SHARED_TEMPLATE_KEY }, select,
    });
    if (!template) {
      throw new ServiceUnavailableException('Shared Activity template is not initialized; contact an operator');
    }
    return this.response(template);
  }

  async update(dto: UpdateActivityFormTemplateDto) {
    const errors = formSchemaErrors(dto.fieldsSchema);
    if (errors.length) throw new BadRequestException(errors);

    // One UPDATE ... WHERE template_key = ? AND version = ? RETURNING ... .
    // Returning the updated row avoids a second read racing with another save.
    const [template] = await this.prisma.activityFormConfig.updateManyAndReturn({
      where: { templateKey: SHARED_TEMPLATE_KEY, version: dto.expectedVersion },
      data: { fieldsSchema: dto.fieldsSchema as Prisma.InputJsonObject, version: { increment: 1 } },
      select,
    });
    if (!template) {
      await this.get(); // Distinguish uninitialized (503) from stale (409).
      throw new ConflictException('The template has changed. Reload it and review your changes before saving again');
    }
    return this.response(template);
  }
}

import type { Nationality } from '../generated/prisma/enums';
import { AppError } from '../common/errors/app-error';

export type DoctorIdentityInput = {
  nationality: Nationality;
  nationalId?: string | null;
  passportNumber?: string | null;
  palestinianId?: string | null;
};

/**
 * Domain error: the NestJS service translates this to BadRequestException.
 * Keeping validation independent of Nest and Prisma runtime modules allows
 * this logic to be tested in the project's CommonJS Jest environment.
 */
export class DoctorIdentityValidationError extends AppError {
  constructor(message: string) {
    super('INVALID_PROFILE', message);
    this.name = 'DoctorIdentityValidationError';
  }
}

function optionalIdentity(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new DoctorIdentityValidationError(`${fieldName} must be a string`);
  }
  return value.trim() || null;
}

/**
 * Call with a complete identity when creating a Doctor.
 * For partial updates, merge existing identity and changed fields first.
 */
export function validateDoctorIdentity(input: DoctorIdentityInput) {
  const nationalId = optionalIdentity(input.nationalId, 'nationalId');
  const passportNumber = optionalIdentity(input.passportNumber, 'passportNumber');
  const palestinianId = optionalIdentity(input.palestinianId, 'palestinianId');

  switch (input.nationality) {
    case 'SYRIAN':
      if (!nationalId || !/^[0-9]{11}$/.test(nationalId)) {
        throw new DoctorIdentityValidationError(
          'Syrian national ID must contain exactly 11 digits',
        );
      }
      if (passportNumber || palestinianId) {
        throw new DoctorIdentityValidationError(
          'Syrian doctors must use only their national ID',
        );
      }
      break;

    case 'NON_SYRIAN':
      if (!passportNumber || nationalId || palestinianId) {
        throw new DoctorIdentityValidationError(
          'Non-Syrian doctors must use only their passport number',
        );
      }
      break;

    case 'PALESTINIAN':
      if (!palestinianId || nationalId || passportNumber) {
        throw new DoctorIdentityValidationError(
          'Palestinian doctors must use only their identity-card number',
        );
      }
      break;

    default:
      throw new DoctorIdentityValidationError('Invalid nationality');
  }

  return { nationality: input.nationality, nationalId, passportNumber, palestinianId };
}

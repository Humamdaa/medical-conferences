import {
  DoctorIdentityValidationError,
  validateDoctorIdentity,
} from './doctor-identity.validator';

describe('validateDoctorIdentity', () => {
  it('accepts an 11-digit Syrian national ID', () => {
    expect(validateDoctorIdentity({ nationality: 'SYRIAN', nationalId: '12345678901' }))
      .toEqual({
        nationality: 'SYRIAN',
        nationalId: '12345678901',
        passportNumber: null,
        palestinianId: null,
      });
  });

  it.each(['1234567890', '123456789012', '1234567890a', ''])('rejects invalid Syrian national ID %s', (nationalId) => {
    expect(() => validateDoctorIdentity({ nationality: 'SYRIAN', nationalId }))
      .toThrow(DoctorIdentityValidationError);
  });

  it('accepts a foreign passport and trims whitespace', () => {
    expect(validateDoctorIdentity({
      nationality: 'NON_SYRIAN',
      passportNumber: ' AB123456 ',
    }).passportNumber).toBe('AB123456');
  });

  it('accepts a Palestinian identity card', () => {
    expect(validateDoctorIdentity({
      nationality: 'PALESTINIAN',
      palestinianId: 'P987654',
    }).palestinianId).toBe('P987654');
  });

  it('rejects missing and conflicting identification', () => {
    expect(() => validateDoctorIdentity({ nationality: 'NON_SYRIAN' }))
      .toThrow(DoctorIdentityValidationError);
    expect(() => validateDoctorIdentity({
      nationality: 'SYRIAN', nationalId: '12345678901', passportNumber: 'ABC',
    })).toThrow(DoctorIdentityValidationError);
    expect(() => validateDoctorIdentity({ nationality: 'PALESTINIAN', palestinianId: ' ' }))
      .toThrow(DoctorIdentityValidationError);
  });

  it('rejects non-string values even if the DTO layer is bypassed', () => {
    expect(() => validateDoctorIdentity({
      nationality: 'NON_SYRIAN',
      passportNumber: 123 as unknown as string,
    })).toThrow(DoctorIdentityValidationError);
  });

  it('rejects unknown nationality values', () => {
    expect(() => validateDoctorIdentity({
      nationality: 'INVALID' as 'SYRIAN',
      nationalId: '12345678901',
    })).toThrow(DoctorIdentityValidationError);
  });
});

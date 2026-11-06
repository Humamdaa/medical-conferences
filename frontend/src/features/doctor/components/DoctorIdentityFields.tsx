
import './DoctorIdentityFields.css';

export type DoctorNationality =
  | 'SYRIAN'
  | 'NON_SYRIAN'
  | 'PALESTINIAN';

export interface DoctorIdentityFormValue {
  nationality: DoctorNationality | '';
  nationalId: string;
  passportNumber: string;
  palestinianId: string;
}

interface Props {
  value: DoctorIdentityFormValue;
  onChange: (next: DoctorIdentityFormValue) => void;
  readOnly?: boolean;
  errors?: Partial<Record<keyof DoctorIdentityFormValue, string>>;
}

export function DoctorIdentityFields({
  value,
  onChange,
  readOnly = false,
  errors,
}: Props) {
  const changeNationality = (
    nationality: DoctorIdentityFormValue['nationality'],
  ) => {
    onChange({
      nationality,
      nationalId: '',
      passportNumber: '',
      palestinianId: '',
    });
  };

  const identityField =
    value.nationality === 'SYRIAN'
      ? { key: 'nationalId' as const, label: 'الرقم الوطني', placeholder: 'أدخل الرقم الوطني (11 رقماً)' }
      : value.nationality === 'NON_SYRIAN'
        ? { key: 'passportNumber' as const, label: 'رقم جواز السفر', placeholder: 'أدخل رقم جواز السفر' }
        : value.nationality === 'PALESTINIAN'
          ? { key: 'palestinianId' as const, label: 'رقم البطاقة الفلسطينية', placeholder: 'أدخل رقم البطاقة' }
          : null;

  return (
    <div
      className={`identity-grid ${!identityField ? 'identity-grid--single' : ''}`}
      dir="rtl"
    >
      <div className="identity-field">
        <label htmlFor="doctor-nationality">
          الجنسية <span>*</span>
        </label>

        <select
          id="doctor-nationality"
          className="identity-control"
          value={value.nationality}
          disabled={readOnly}
          aria-invalid={!!errors?.nationality}
          onChange={(event) =>
            changeNationality(
              event.target.value as DoctorIdentityFormValue['nationality'],
            )
          }
        >
          <option value="" disabled>اختر الجنسية</option>
          <option value="SYRIAN">سوري</option>
          <option value="NON_SYRIAN">غير سوري</option>
          <option value="PALESTINIAN">فلسطيني</option>
        </select>

        {errors?.nationality && (
          <small className="identity-error" role="alert">
            {errors.nationality}
          </small>
        )}
      </div>

      {identityField && (
        <div className="identity-field">
          <label htmlFor="doctor-identity-number">
            {identityField.label} <span>*</span>
          </label>

          <input
            id="doctor-identity-number"
            className="identity-control"
            type="text"
            dir="ltr"
            value={value[identityField.key]}
            placeholder={identityField.placeholder}
            readOnly={readOnly}
            inputMode={
              value.nationality === 'SYRIAN' ? 'numeric' : 'text'
            }
            maxLength={
              value.nationality === 'SYRIAN' ? 11 : 64
            }
            autoComplete="off"
            aria-invalid={!!errors?.[identityField.key]}
            onChange={(event) => {
              const input =
                value.nationality === 'SYRIAN'
                  ? event.target.value.replace(/\D/g, '')
                  : event.target.value;

              onChange({
                ...value,
                [identityField.key]: input,
              });
            }}
          />

          {errors?.[identityField.key] && (
            <small className="identity-error" role="alert">
              {errors[identityField.key]}
            </small>
          )}
        </div>
      )}
    </div>
  );
}

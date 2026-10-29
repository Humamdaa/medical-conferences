
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BadgeCheck,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  LockKeyhole,
  Mail,
  Save,
  UserRound,
} from 'lucide-react';

import { doctorApi } from '../api/doctor.api';
import type {
  SpecialistOption,
  UpdateDoctorProfileInput,
} from '../api/doctor.api';

import { useDoctorProfile } from '../hooks/useDoctorProfile';
import {
  validateDoctorProfile,
  type DoctorField,
} from '../validation/doctor-profile.validation';

// Field labels are shared between the form and checklist.
const fieldLabels: Record<DoctorField | 'email', string> = {
  firstName: 'الاسم الأول',
  lastName: 'اسم العائلة',
  email: 'البريد الإلكتروني',
  specialistId: 'الاختصاص الطبي',
  nationalId: 'الرقم الوطني',
  residence: 'مكان الإقامة',
  clinicAddress: 'عنوان العيادة',
  phoneNumber: 'رقم الهاتف',
  certificateIssuedAt: 'تاريخ إصدار الشهادة',
  certificateNumber: 'رقم الشهادة',
  fatherName: 'اسم الأب',
};

const textFields = [
  'nationalId',
  'residence',
  'clinicAddress',
  'phoneNumber',
  'certificateNumber',
  'fatherName',
] as const;

const numericFields = [
  'nationalId',
  'phoneNumber',
  'certificateNumber',
] as const;

export function DoctorProfilePage() {
  const { profile, updateProfile } = useDoctorProfile();
  const navigate = useNavigate();

  // All editable fields in one state.
  const [form, setForm] = useState<UpdateDoctorProfileInput>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    specialistId: profile.specialist?.id ?? '',
    nationalId: profile.nationalId ?? '',
    residence: profile.residence ?? '',
    clinicAddress: profile.clinicAddress ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    certificateIssuedAt: profile.certificateIssuedAt?.slice(0, 10) ?? '',
    certificateNumber: profile.certificateNumber ?? '',
    fatherName: profile.fatherName ?? '',
  });

  const [specialists, setSpecialists] = useState<SpecialistOption[]>([]);
  const [specialistsError, setSpecialistsError] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load medical specialties.
  useEffect(() => {
    let active = true;

    doctorApi.specialists()
      .then((items) => {
        if (active) setSpecialists(items);
      })
      .catch(() => {
        if (active) {
          setSpecialistsError('تعذّر تحميل الاختصاصات الطبية.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Validate using our existing validation function.
  const validationErrors = validateDoctorProfile(form);

  function fieldError(name: DoctorField) {
    return submitted ? validationErrors[name] : undefined;
  }

  function renderError(name: DoctorField) {
    const message = fieldError(name);

    if (!message) return null;

    return (
      <small
        id={`error-${name}`}
        className="doctor-field-error"
        role="alert"
      >
        {message}
      </small>
    );
  }

  function updateField(name: DoctorField, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
    setError('');
  }

  // Save only when every field is valid.
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitted(true);
    setError('');
    setSaved(false);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const updated = await doctorApi.updateProfile(form);

      updateProfile(updated);
      setSaved(true);
      setSubmitted(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذّر حفظ الملف الشخصي.',
      );
    } finally {
      setSaving(false);
    }
  }

  // Calculate completion from the current valid input.
  function isFieldComplete(name: DoctorField | 'email') {
    if (name === 'email') {
      return Boolean(profile.email.trim());
    }

    return Boolean(form[name]?.trim()) && !validationErrors[name];
  }

  const checklistFields = Object.keys(fieldLabels) as
    (DoctorField | 'email')[];

  const totalFields = checklistFields.length;
  const completed = checklistFields.filter(isFieldComplete).length;
  const completion = Math.round((completed / totalFields) * 100);

  return (
    <div className="doctor-content">

      {/* Page heading */}
      <div className="doctor-page-head">
        <div>
          <span className="doctor-overline">إدارة الحساب</span>

          <h1>
            الملف الشخصي{' '}
            <span className="doctor-title-accent">للطبيب</span>
          </h1>

          <p>
            أكمل بياناتك المهنية لتصبح جاهزاً للتسجيل
            في الأنشطة عند تفعيل الخدمة.
          </p>
        </div>

        <div className="doctor-head-mark">
          <UserRound size={30} />
        </div>
      </div>

      <div className="doctor-profile-grid">

        {/* Profile form */}
        <section className="doctor-panel doctor-profile-form-panel">

          <div className="doctor-panel-heading">
            <div>
              <h2>المعلومات الأساسية والمهنية</h2>
              <p>يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح.</p>
            </div>

            <span className="doctor-mini-icon">
              <ClipboardCheck size={20} />
            </span>
          </div>

          <form
            className="doctor-form"
            onSubmit={onSubmit}
            noValidate
          >

            {/* First name and last name */}
            <div className="doctor-form-grid">

              {(['firstName', 'lastName'] as const).map((name) => (
                <label className="doctor-field" key={name}>
                  <span>
                    {fieldLabels[name]} <b>*</b>
                  </span>

                  <div className="doctor-field-control">
                    <UserRound size={17} />

                    <input
                      type="text"
                      value={form[name] ?? ''}
                      maxLength={20}
                      onChange={(e) => updateField(name, e.target.value)}
                      aria-invalid={Boolean(fieldError(name))}
                      aria-describedby={
                        fieldError(name) ? `error-${name}` : undefined
                      }
                      autoComplete={
                        name === 'firstName'
                          ? 'given-name'
                          : 'family-name'
                      }
                    />
                  </div>

                  {renderError(name)}
                </label>
              ))}

            </div>

            {/* Email - read only */}
            <label className="doctor-field">
              <span>البريد الإلكتروني</span>

              <div className="doctor-field-control is-readonly">
                <Mail size={17} />

                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  dir="ltr"
                />

                <LockKeyhole size={15} />
              </div>

              <small>
                البريد للعرض فقط، وتغييره يتطلب إجراء تحقق مستقل.
              </small>
            </label>

            {/* Medical specialty */}
            <label className="doctor-field">
              <span>الاختصاص الطبي <b>*</b></span>

              <select
                value={form.specialistId ?? ''}
                onChange={(e) => updateField('specialistId', e.target.value)}
                aria-invalid={Boolean(fieldError('specialistId'))}
                aria-describedby={
                  fieldError('specialistId')
                    ? 'error-specialistId'
                    : undefined
                }
              >
                <option value="">اختر اختصاصك الطبي</option>

                {specialists.map((specialist) => (
                  <option
                    key={specialist.id}
                    value={specialist.id}
                  >
                    {specialist.name}
                  </option>
                ))}

                {profile.specialist &&
                  !specialists.some(
                    (item) => item.id === profile.specialist?.id,
                  ) && (
                    <option value={profile.specialist.id}>
                      {profile.specialist.name}
                    </option>
                  )}
              </select>

              {renderError('specialistId')}
            </label>

            {/* Doctor professional information */}
            <div className="doctor-form-grid">

              {textFields.map((name) => {
                const numeric = numericFields.some(
                  (field) => field === name,
                );

                return (
                  <label className="doctor-field" key={name}>
                    <span>
                      {fieldLabels[name]} <b>*</b>
                    </span>

                    <input
                      type="text"
                      value={form[name] ?? ''}
                      onChange={(e) => updateField(name, e.target.value)}
                      aria-invalid={Boolean(fieldError(name))}
                      aria-describedby={
                        fieldError(name)
                          ? `error-${name}`
                          : undefined
                      }
                      inputMode={numeric ? 'numeric' : 'text'}
                      dir={numeric ? 'ltr' : 'rtl'}
                    />

                    {renderError(name)}
                  </label>
                );
              })}

            </div>

            {/* Certificate issue date */}
            <label className="doctor-field">
              <span>تاريخ إصدار الشهادة <b>*</b></span>

              <input
                type="date"
                value={form.certificateIssuedAt ?? ''}
                onChange={(e) =>
                  updateField('certificateIssuedAt', e.target.value)
                }
                aria-invalid={Boolean(
                  fieldError('certificateIssuedAt'),
                )}
                aria-describedby={
                  fieldError('certificateIssuedAt')
                    ? 'error-certificateIssuedAt'
                    : undefined
                }
              />

              {renderError('certificateIssuedAt')}
            </label>

            {/* First-time profile notice */}
            {!profile.doctorExists && (
              <div className="doctor-info-note">
                <CircleHelp size={20} />

                <div>
                  <strong>ملاحظة حول أول حفظ</strong>
                  <p>
                    لإنشاء الملف المهني لأول مرة، أدخل جميع
                    الحقول المطلوبة ثم اضغط حفظ التغييرات.
                  </p>
                </div>
              </div>
            )}

            {/* API errors and success messages */}
            {specialistsError && (
              <div className="doctor-alert danger" role="alert">
                {specialistsError}
              </div>
            )}

            {error && (
              <div className="doctor-alert danger" role="alert">
                {error}
              </div>
            )}

            {saved && (
              <div className="doctor-alert success" role="status">
                <CircleCheck size={18} />
                تم حفظ البيانات بنجاح.
              </div>
            )}

            {/* Save */}
            <div className="doctor-form-actions">
              <button
                type="submit"
                className="doctor-primary-button"
                disabled={saving}
              >
                {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                <Save size={18} />
              </button>

              <span>الحقول بعلامة * مطلوبة</span>
            </div>

          </form>
        </section>

        {/* Profile information */}
        <aside className="doctor-profile-aside">

          {/* Completion progress */}
          <div className="doctor-panel doctor-progress-card">
            <span className="doctor-card-icon">
              <BadgeCheck size={24} />
            </span>

            <h2>اكتمال ملفك</h2>

            <p>
              أكمل بياناتك لتكون جاهزاً للتسجيل
              في الأنشطة عند تفعيل الخدمة.
            </p>

            <div className="doctor-progress-head">
              <strong>{completion}%</strong>
              <span>
                {profile.isComplete
                  ? 'مكتمل ومحفوظ'
                  : 'قيد الإكمال'}
              </span>
            </div>

            <div className="doctor-progress-track">
              <div style={{ width: `${completion}%` }} />
            </div>

            <span className="doctor-progress-small">
              {completed} من {totalFields} بيانات صحيحة
            </span>
          </div>

          {/* Completion checklist */}
          <div className="doctor-panel doctor-checklist">
            <h3>قائمة التحقق</h3>

            {checklistFields.map((name) => {
              const complete = isFieldComplete(name);

              return (
                <div className="doctor-check-item" key={name}>
                  <span
                    className={
                      complete
                        ? 'doctor-check-done'
                        : 'doctor-check-empty'
                    }
                  >
                    <CircleCheck size={18} />
                  </span>

                  <span>{fieldLabels[name]}</span>

                  {!complete && <small>غير مكتمل</small>}
                </div>
              );
            })}
          </div>

          {/* Activities navigation */}
          <div className="doctor-info-note">
            <CircleHelp size={20} />

            <div>
              <strong>ما الخطوة التالية؟</strong>

              <p>
                بعد إكمال الملف يمكنك استعراض الأنشطة.
                التسجيل كحاضر أو مشارك سيُفعّل لاحقاً.
              </p>

              <button
                className="doctor-text-link"
                type="button"
                onClick={() => navigate('/doctor/activities')}
              >
                استعراض الأنشطة <ArrowLeft size={16} />
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

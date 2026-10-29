
import type { UpdateDoctorProfileInput } from '../api/doctor.api';

export type DoctorField = keyof UpdateDoctorProfileInput;
export type DoctorErrors = Partial<Record<DoctorField, string>>;

const fieldLabels: Record<DoctorField, string> = {
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    specialistId: 'الاختصاص الطبي',
    nationalId: 'الرقم الوطني',
    residence: 'مكان الإقامة',
    clinicAddress: 'عنوان العيادة',
    phoneNumber: 'رقم الهاتف',
    certificateIssuedAt: 'تاريخ إصدار الشهادة',
    certificateNumber: 'رقم الشهادة',
    fatherName: 'اسم الأب',
};

export function validateDoctorProfile(
    values: UpdateDoctorProfileInput,
): DoctorErrors {
    const errors: DoctorErrors = {};

    for (const field of Object.keys(fieldLabels) as DoctorField[]) {
        if (!values[field]?.trim()) {
            errors[field] = `${fieldLabels[field]} مطلوب`;
        }
    }

    for (const field of [
        'nationalId',
        'phoneNumber',
        'certificateNumber',
    ] as const) {
        const value = values[field]?.trim();

        if (value && !/^[0-9]+$/.test(value)) {
            errors[field] = `${fieldLabels[field]} يجب أن يحتوي على أرقام فقط`;
        }
    }

    if ((values.phoneNumber?.trim().length ?? 0) > 12) {
        errors.phoneNumber = 'رقم الهاتف يجب ألا يتجاوز 12 رقماً';
    }

    for (const field of ['firstName', 'lastName'] as const) {
        if ((values[field]?.trim().length ?? 0) > 20) {
            errors[field] = `${fieldLabels[field]} يجب ألا يتجاوز 20 حرفاً`;
        }
    }

    const specialistId = values.specialistId?.trim();
    if (specialistId && !/^[1-9][0-9]*$/.test(specialistId)) {
        errors.specialistId = 'يرجى اختيار اختصاص طبي صحيح';
    }

    const date = values.certificateIssuedAt?.trim();
    if (date) {
        const parsed = new Date(`${date}T00:00:00.000Z`);
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            Number.isNaN(parsed.getTime()) ||
            !parsed.toISOString().startsWith(date)
        ) {
            errors.certificateIssuedAt = 'تاريخ إصدار الشهادة غير صحيح';
        }
    }

    return errors;
}

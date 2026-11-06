import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(128, 'كلمة المرور طويلة جداً')
  .regex(/[A-Z]/, 'أضف حرفاً إنجليزياً كبيراً')
  .regex(/[a-z]/, 'أضف حرفاً إنجليزياً صغيراً')
  .regex(/[0-9]/, 'أضف رقماً واحداً على الأقل')
  .regex(/[^A-Za-z0-9]/, 'أضف رمزاً خاصاً واحداً على الأقل');

export const loginSchema = z.object({
  email: z.string().trim().email('أدخل بريداً إلكترونياً صحيحاً'),
  password: z.string().min(1, 'أدخل كلمة المرور'),
});


export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(20),
  lastName: z.string().trim().min(1).max(20),
  email: z.string().trim().email(),

  password: passwordSchema,
  confirmPassword: z.string().min(1),

  nationality: z.enum(
    ['SYRIAN', 'NON_SYRIAN', 'PALESTINIAN'],
    { error: 'يرجى اختيار الجنسية' },
  ),

  nationalId: z.string(),
  passportNumber: z.string(),
  palestinianId: z.string(),
})
  .superRefine((data, ctx) => {
    if (
      data.nationality === 'SYRIAN' &&
      !/^[0-9]{11}$/.test(data.nationalId)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['nationalId'],
        message: 'الرقم الوطني يجب أن يتكون من 11 رقماً',
      });
    }

    if (
      data.nationality === 'NON_SYRIAN' &&
      !data.passportNumber.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['passportNumber'],
        message: 'رقم جواز السفر مطلوب',
      });
    }

    if (
      data.nationality === 'PALESTINIAN' &&
      !data.palestinianId.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['palestinianId'],
        message: 'رقم البطاقة الفلسطينية مطلوب',
      });
    }

    const unused =
      data.nationality === 'SYRIAN'
        ? ['passportNumber', 'palestinianId'] as const
        : data.nationality === 'NON_SYRIAN'
          ? ['nationalId', 'palestinianId'] as const
          : ['nationalId', 'passportNumber'] as const;

    for (const field of unused) {
      if (data[field].trim()) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'لا يمكن إدخال نوع هوية آخر',
        });
      }
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  });


export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

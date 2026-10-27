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
  firstName: z.string().trim().min(1, 'أدخل الاسم الأول').max(20, 'الحد الأقصى 20 حرفاً'),
  lastName: z.string().trim().min(1, 'أدخل اسم العائلة').max(20, 'الحد الأقصى 20 حرفاً'),
  email: z.string().trim().email('أدخل بريداً إلكترونياً صحيحاً'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'أعد إدخال كلمة المرور'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { authApi } from '../api/auth.api';
import { registerSchema } from '../schemas/auth.schemas';
import type { RegisterValues } from '../schemas/auth.schemas';
import { TextField } from '../../../shared/ui/TextField';

export function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'تعذّر إنشاء الحساب.');
    }
  });

  return (
    <AuthShell heading="أنشئ حسابك" subheading="خطوة واحدة للبدء في منصة المؤتمرات الطبية.">
      {serverError && <p className="notice notice--error" role="alert">{serverError}</p>}
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="form-row">
          <TextField label="الاسم الأول" autoComplete="given-name" placeholder="الاسم الأول"
            icon={<UserRound size={18} />} error={errors.firstName?.message} {...register('firstName')} />
          <TextField label="اسم العائلة" autoComplete="family-name" placeholder="اسم العائلة"
            icon={<UserRound size={18} />} error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <TextField label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="email"
          placeholder="name@example.com" icon={<Mail size={18} />} error={errors.email?.message} {...register('email')} />
        <TextField label="كلمة المرور" type="password" dir="ltr" autoComplete="new-password"
          placeholder="••••••••" icon={<LockKeyhole size={18} />} error={errors.password?.message} {...register('password')} />
        <TextField label="تأكيد كلمة المرور" type="password" dir="ltr" autoComplete="new-password"
          placeholder="••••••••" icon={<LockKeyhole size={18} />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <p className="password-hint">8 أحرف على الأقل، تتضمن حرفاً كبيراً وصغيراً ورقماً ورمزاً خاصاً.</p>
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          <span>{isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب'}</span><ArrowLeft size={19} />
        </button>
      </form>
      <p className="form-switch">لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link></p>
    </AuthShell>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { authApi } from '../api/auth.api';
import { loginSchema } from '../schemas/auth.schemas';
import type { LoginValues } from '../schemas/auth.schemas';
import { TextField } from '../../../shared/ui/TextField';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await authApi.login({ email: values.email, password: values.password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'تعذّر تسجيل الدخول.');
    }
  });

  return (
    <AuthShell heading="أهلاً بعودتك" subheading="سجّل دخولك للمتابعة إلى مساحة عملك.">
      {registered && <p className="notice notice--success" role="status">تم إنشاء حسابك بنجاح. يمكنك تسجيل الدخول الآن.</p>}
      {serverError && <p className="notice notice--error" role="alert">{serverError}</p>}
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <TextField label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="email"
          placeholder="name@example.com" icon={<Mail size={18} />} error={errors.email?.message} {...register('email')} />
        <TextField label="كلمة المرور" type="password" dir="ltr" autoComplete="current-password"
          placeholder="••••••••" icon={<LockKeyhole size={18} />} error={errors.password?.message} {...register('password')} />
        <div className="form-hint"><ShieldCheck size={15} /><span>اتصال آمن وجلسة محمية</span></div>
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          <span>{isSubmitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</span><ArrowLeft size={19} />
        </button>
      </form>
      <p className="form-switch">ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link></p>
    </AuthShell>
  );
}

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Save, UserRound } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { adminApi } from '../api/admin.api';
import type { AdminOutletContext } from '../components/AdminLayout';

export function AdminProfilePage() {
  const { user } = useAuth();
  const { setDisplayName } = useOutletContext<AdminOutletContext>();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    adminApi.getProfile().then((profile) => {
      if (!active) return;
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setDisplayName(profile.firstName, profile.lastName);
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : 'تعذّر تحميل الملف الشخصي.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [setDisplayName]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    setError('');
    setSuccess('');
    if (!first || !last || first.length > 100 || last.length > 100) {
      setError('أدخل الاسم الأول والكنية بشكل صحيح (حتى 100 حرف لكل منهما).');
      return;
    }
    setSaving(true);
    try {
      const updated = await adminApi.updateProfile({ firstName: first, lastName: last });
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setEmail(updated.email);
      setDisplayName(updated.firstName, updated.lastName);
      setSuccess('تم حفظ بياناتك بنجاح.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر حفظ التعديلات.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">البيانات الشخصية</span><h1>ملفي الشخصي</h1><p>عرض معلومات الحساب وتعديل الاسم الأول والكنية.</p></div><span className="admin-heading-icon"><UserRound size={26} /></span></div>
      <section className="admin-panel admin-profile-panel">
        <div className="admin-panel-heading"><h2>معلومات المدير</h2><p>البريد الإلكتروني والصلاحية للعرض فقط.</p></div>
        {loading ? <p className="admin-muted">جارٍ تحميل البيانات...</p> : (
          <form onSubmit={save} noValidate>
            <div className="admin-two-columns">
              <label className="admin-field">الاسم الأول
                <input value={firstName} maxLength={100} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
              <label className="admin-field">الكنية
                <input value={lastName} maxLength={100} onChange={(e) => setLastName(e.target.value)} required />
              </label>
              <label className="admin-field">البريد الإلكتروني
                <input value={email} readOnly disabled />
              </label>
              <label className="admin-field">الدور
                <input value="مدير النظام (ADMIN)" readOnly disabled />
              </label>
            </div>
            {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
            {success && <div className="admin-alert admin-alert--success" role="status">{success}</div>}
            <div className="admin-form-footer"><button className="admin-button" type="submit" disabled={saving}><Save size={17} /> {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</button></div>
          </form>
        )}
        {loading && error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      </section>
    </div>
  );
}

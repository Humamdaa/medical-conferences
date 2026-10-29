
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { activitiesApi } from '../api/activities.api';
import type { ActivityDetails } from '../api/activities.api';

const dateFormat = new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return 'غير محدد';
    }

    if (typeof value === 'boolean') {
        return value ? 'نعم' : 'لا';
    }

    if (Array.isArray(value)) {
        return value.map(formatValue).join('، ');
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

export function DoctorActivityDetailsPage() {
    const { id } = useParams<{ id: string }>();

    const [activity, setActivity] = useState<ActivityDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) {
            setError('معرّف النشاط غير صالح');
            setLoading(false);
            return;
        }

        let active = true;

        setLoading(true);
        setError('');

        activitiesApi.get(id)
            .then((data) => {
                if (active) setActivity(data);
            })
            .catch((err: unknown) => {
                if (active) {
                    setError(
                        err instanceof Error ? err.message : 'تعذّر تحميل تفاصيل النشاط',
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return <div className="doctor-loading">جارٍ تحميل تفاصيل النشاط...</div>;
    }

    if (error || !activity) {
        return (
            <div className="doctor-error" role="alert">
                {error || 'النشاط غير موجود'}
            </div>
        );
    }

    const definitions = activity.formSchemaSnapshot?.fields ?? [];
    const values = activity.customFields ?? {};

    const dynamicFields = Object.entries(values).map(([name, value]) => {
        const definition = definitions.find((field) => field.name === name);

        return {
            name,
            label: definition?.label || name,
            value: formatValue(value),
        };
    });

    return (
        <div className="doctor-content">
            <div className="doctor-page-head">
                <div>
                    <Link to="/doctor/activities" className="doctor-back-link">
                        <ArrowRight size={17} /> العودة إلى الأنشطة
                    </Link>

                    <h1>{activity.name}</h1>
                    <p>{activity.institution}</p>
                </div>
            </div>

            <section className="doctor-panel doctor-activity-details">
                <h2>تفاصيل النشاط</h2>

                <div className="doctor-detail-grid">
                    <div className="doctor-detail-item">
                        <span>نوع النشاط</span>
                        <strong>{activity.activityType}</strong>
                    </div>

                    <div className="doctor-detail-item">
                        <span>الاختصاص الطبي</span>
                        <strong>{activity.specialist.name}</strong>
                    </div>

                    <div className="doctor-detail-item">
                        <span><CalendarDays size={16} /> تاريخ البداية</span>
                        <strong>{dateFormat.format(new Date(activity.startAt))}</strong>
                    </div>

                    <div className="doctor-detail-item">
                        <span><Clock3 size={16} /> تاريخ النهاية</span>
                        <strong>{dateFormat.format(new Date(activity.endAt))}</strong>
                    </div>

                    <div className="doctor-detail-item">
                        <span><MapPin size={16} /> مكان النشاط</span>
                        <strong>{activity.location}</strong>
                    </div>

                    <div className="doctor-detail-item">
                        <span>النقاط العلمية</span>
                        <strong>{activity.points} نقطة</strong>
                    </div>
                </div>

                <div className="doctor-detail-section">
                    <h3>وصف النشاط</h3>
                    <p className="doctor-detail-description">{activity.description}</p>
                </div>

                {dynamicFields.length > 0 && (
                    <div className="doctor-detail-section">
                        <h3>معلومات إضافية عن النشاط</h3>

                        <div className="doctor-detail-grid">
                            {dynamicFields.map((field) => (
                                <div className="doctor-detail-item" key={field.name}>
                                    <span>{field.label}</span>
                                    <strong>{field.value}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="doctor-activity-actions">
                    <button type="button" disabled>حاضر</button>
                    <button type="button" disabled>مشارك</button>
                </div>
            </section>
        </div>
    );
}

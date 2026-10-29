
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Award,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    ListChecks,
} from 'lucide-react';

import { myActivitiesApi } from '../api/my-activities.api';
import type {
    MyActivity,
    MyActivitiesResponse,
    AttendanceStatus,
    ParticipationRole,
} from '../api/my-activities.api';

const statusLabels: Record<AttendanceStatus, string> = {
    REGISTERED: 'مسجّل',
    ATTENDED: 'تم الحضور',
    CANCELLED: 'ملغى',
};

const roleLabels: Record<ParticipationRole, string> = {
    ATTENDEE: 'حاضر',
    PARTICIPANT: 'مشارك',
};

const dateFormatter = new Intl.DateTimeFormat('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

function ActivityItem({ activity }: { activity: MyActivity }) {
    const attended = activity.status === 'ATTENDED';

    return (
        <article className="doctor-panel doctor-my-activity">
            <div className="doctor-my-activity-header">
                <div>
                    <h3>{activity.activityName}</h3>
                    <span className="doctor-my-meta">
                        <CalendarDays size={15} />
                        {dateFormatter.format(new Date(activity.date))}
                    </span>
                </div>

                <span
                    className={`doctor-my-status doctor-my-status--${activity.status.toLowerCase()}`}
                >
                    {statusLabels[activity.status]}
                </span>
            </div>

            <div className="doctor-my-activity-info">
                <span>
                    نوع التسجيل:
                    <strong>{roleLabels[activity.participationRole]}</strong>
                </span>

                <span>
                    نقاط النشاط:
                    <strong>{activity.availablePoints}</strong>
                </span>

                <span>
                    النقاط المكتسبة:
                    <strong className={attended ? 'doctor-earned-points' : ''}>
                        {activity.earnedPoints}
                    </strong>
                </span>
            </div>

            <div className="doctor-my-activity-footer">
                <Link to={`/doctor/activities/${activity.activityId}`}>
                    عرض تفاصيل النشاط
                </Link>

                <span className="doctor-my-certificate">
                    <FileText size={16} />
                    {attended
                        ? 'الشهادة ستتاح لاحقاً'
                        : 'لا توجد شهادة حالياً'}
                </span>
            </div>
        </article>
    );
}

export function DoctorMyActivitiesPage() {
    const [data, setData] = useState<MyActivitiesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        myActivitiesApi.getAll()
            .then((result) => {
                if (active) setData(result);
            })
            .catch((err: unknown) => {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'تعذّر تحميل أنشطتك.',
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const attendedCount = data?.activities.filter(
        (activity) => activity.status === 'ATTENDED',
    ).length ?? 0;

    return (
        <div className="doctor-content">
            <div className="doctor-page-head">
                <div>
                    <span className="doctor-overline">
                        سجل مشاركاتك العلمية
                    </span>
                    <h1>
                        نشاطاتي <span className="doctor-title-accent">ونقاطي</span>
                    </h1>
                    <p>
                        استعرض أنشطتك المسجلة، وحالة الحضور،
                        والنقاط المكتسبة من كل نشاط.
                    </p>
                </div>

                <div className="doctor-head-mark">
                    <Award size={30} />
                </div>
            </div>

            {loading && (
                <div className="doctor-loading">
                    <Clock3 size={20} />
                    جارٍ تحميل بياناتك...
                </div>
            )}

            {!loading && error && (
                <div className="doctor-alert danger" role="alert">
                    {error}
                </div>
            )}

            {!loading && data && (
                <>
                    <div className="doctor-my-summary">
                        <div className="doctor-panel doctor-my-stat">
                            <Award size={26} />
                            <span>مجموع النقاط المكتسبة</span>
                            <strong>{data.totalPoints}</strong>
                            <small>نقطة</small>
                        </div>

                        <div className="doctor-panel doctor-my-stat">
                            <CheckCircle2 size={26} />
                            <span>الأنشطة التي تم حضورها</span>
                            <strong>{attendedCount}</strong>
                            <small>نشاط</small>
                        </div>

                        <div className="doctor-panel doctor-my-stat">
                            <ListChecks size={26} />
                            <span>مجموع أنشطتي</span>
                            <strong>{data.activities.length}</strong>
                            <small>تسجيل</small>
                        </div>
                    </div>

                    <div className="doctor-my-section-heading">
                        <h2>سجل الأنشطة</h2>
                        <Link to="/doctor/activities">
                            استكشاف الأنشطة
                        </Link>
                    </div>

                    {data.activities.length === 0 ? (
                        <div className="doctor-empty">
                            <Award size={36} />
                            <h3>لا توجد أنشطة مسجلة بعد</h3>
                            <p>
                                ستظهر هنا الأنشطة التي تسجل فيها مستقبلاً.
                            </p>
                        </div>
                    ) : (
                        <div className="doctor-my-activities-list">
                            {data.activities.map((activity) => (
                                <ActivityItem
                                    key={activity.activityId}
                                    activity={activity}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

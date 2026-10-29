
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  Search,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { activitiesApi } from '../api/activities.api';
import type {
  ActivityListResponse,
  ActivitySummary,
} from '../api/activities.api';

const dateFormat = new Intl.DateTimeFormat('ar-SY', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('ar-SY', {
  hour: '2-digit',
  minute: '2-digit',
});

function ActivityCard({ activity }: { activity: ActivitySummary }) {
  const hasEnded = new Date(activity.endAt).getTime() < Date.now();

  return (
    <article className="doctor-activity-card">
      <div className="doctor-activity-card-top">
        <span className="doctor-activity-type">
          {activity.activityType}
        </span>

        <span className={
          hasEnded
            ? 'doctor-activity-state past'
            : 'doctor-activity-state'
        }>
          {hasEnded ? 'منتهٍ' : 'قادم'}
        </span>
      </div>

      <div className="doctor-activity-emblem">
        <GraduationCap size={27} />
      </div>

      <h3>{activity.name}</h3>
      <p className="doctor-activity-org">{activity.institution}</p>

      <div className="doctor-activity-info">
        <span>
          <CalendarDays size={16} />
          {dateFormat.format(new Date(activity.startAt))}
        </span>

        <span>
          <Clock3 size={16} />
          {timeFormat.format(new Date(activity.startAt))}
        </span>

        <span>
          <MapPin size={16} />
          {activity.location}
        </span>
      </div>

      <div className="doctor-activity-footer">
        <span className="doctor-specialist-tag">
          {activity.specialist.name}
        </span>

        <span className="doctor-points">
          {activity.points} نقطة
        </span>
      </div>

      <Link
        to={`/doctor/activities/${activity.id}`}
        className="doctor-details-link"
      >
        عرض تفاصيل النشاط
      </Link>

      <div className="doctor-activity-actions">
        <button type="button" disabled>حاضر</button>
        <button type="button" disabled>مشارك</button>
      </div>
    </article>
  );
}

export function DoctorActivitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<ActivityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    activitiesApi.list(page)
      .then((data) => {
        if (active) {
          setResult(data);
          setError('');
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'تعذّر تحميل الأنشطة',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const items = result?.items.filter((activity) =>
    `${activity.name} ${activity.institution} ${activity.specialist.name}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  ) ?? [];

  return (
    <div className="doctor-content">
      <div className="doctor-page-head">
        <div>
          <span className="doctor-overline">
            الفعاليات والتعليم المستمر
          </span>
          <h1>
            الأنشطة <span className="doctor-title-accent">العلمية</span>
          </h1>
          <p>استعرض الأنشطة والمؤتمرات الطبية.</p>
        </div>

        <div className="doctor-head-mark">
          <CalendarDays size={30} />
        </div>
      </div>

      <div className="doctor-activities-toolbar">
        <div>
          <h2>استكشف الأنشطة</h2>
          <p>{result ? `${result.total} نشاط في قاعدة البيانات` : 'قائمة الأنشطة'}</p>
        </div>

        <label className="doctor-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو الجهة أو الاختصاص..."
            aria-label="البحث في الأنشطة"
          />
        </label>
      </div>

      {error && (
        <div className="doctor-alert danger" role="alert">{error}</div>
      )}

      {loading ? (
        <div className="doctor-loading">
          <Clock3 size={25} /> جارٍ تحميل الأنشطة...
        </div>
      ) : items.length > 0 ? (
        <div className="doctor-activities-grid">
          {items.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="doctor-empty">
          <UsersRound size={36} />
          <h3>لا توجد أنشطة مطابقة</h3>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div className="doctor-pagination">
          <button
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value - 1);
            }}
          >
            السابق
          </button>

          <span>صفحة {page} من {result.totalPages}</span>

          <button
            disabled={page >= result.totalPages || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value + 1);
            }}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

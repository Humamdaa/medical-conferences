
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}


export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'تعذّر الاتصال بالخادم. تحقق من تشغيل الـ Backend.');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const data = payload as { message?: unknown; code?: unknown } | null;
    const message = typeof data?.message === 'string'
      ? data.message
      : 'حدث خطأ أثناء تنفيذ الطلب.';

    console.error('API Error:', {
      status: response.status,
      code: data?.code,
      message: data?.message,
    });

    const code = typeof data?.code === 'string' ? data.code : 'HTTP_ERROR';
    throw new ApiError(response.status, code, message);
  }

  return payload as T;
}


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
    const data =
      payload !== null && typeof payload === 'object'
        ? payload as { code?: unknown; message?: unknown }
        : null;

    const messages = data?.message;

    const message = Array.isArray(messages)
      ? messages.filter((m): m is string => typeof m === 'string').join('\n')
      : typeof messages === 'string'
        ? messages
        : '';

    const code =
      typeof data?.code === 'string' ? data.code : 'HTTP_ERROR';

    throw new ApiError(
      response.status,
      code,
      message.trim() || `تعذّر تنفيذ الطلب (HTTP ${response.status})`,
    );
  }

  return payload as T;

}

import type {
  ActivityEvent,
  AutoReport,
  AutoReportPeriod,
  Book,
  BootstrapPayload,
  Loan,
  ReportScheduleConfig,
  User,
} from '../types/library';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Permintaan gagal (${res.status})`);
  }
  return data;
}

export const libraryApi = {
  getBootstrap(): Promise<BootstrapPayload> {
    return requestJson<BootstrapPayload>('/api/bootstrap');
  },

  login(payload: { email?: string; userId?: string }): Promise<{ user: User }> {
    return requestJson<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  registerMember(payload: { name: string; email: string }): Promise<{ user: User }> {
    return requestJson<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createBook(payload: Partial<Book> & { actorId: string }): Promise<{ book: Book }> {
    return requestJson<{ book: Book }>('/api/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBook(bookId: string, payload: Partial<Book> & { actorId: string }): Promise<{ book: Book }> {
    return requestJson<{ book: Book }>(`/api/books/${bookId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteBook(bookId: string, actorId: string): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/books/${bookId}?actorId=${encodeURIComponent(actorId)}`, {
      method: 'DELETE',
    });
  },

  borrowBook(payload: {
    bookId: string;
    userId: string;
    durationDays: 7 | 14;
    actorId: string;
  }): Promise<{ loan: Loan }> {
    return requestJson<{ loan: Loan }>('/api/loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  returnLoan(loanId: string, actorId: string): Promise<{ loan: Loan }> {
    return requestJson<{ loan: Loan }>(`/api/loans/${loanId}/return`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    });
  },

  renewLoan(loanId: string, actorId: string): Promise<{ loan: Loan }> {
    return requestJson<{ loan: Loan }>(`/api/loans/${loanId}/renew`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    });
  },

  generateReport(period: AutoReportPeriod, actorId: string): Promise<{ report: AutoReport }> {
    return requestJson<{ report: AutoReport }>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ period, actorId }),
    });
  },

  updateSchedule(
    payload: Partial<ReportScheduleConfig> & { actorId: string }
  ): Promise<{ schedule: ReportScheduleConfig }> {
    return requestJson<{ schedule: ReportScheduleConfig }>('/api/reports/schedule', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  subscribeRealtime(callbacks: {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onSync: (payload: {
      eventType: string;
      activity: ActivityEvent | null;
      bootstrap: BootstrapPayload;
    }) => void;
  }): () => void {
    const source = new EventSource('/api/stream');

    source.addEventListener('connected', () => {
      callbacks.onConnected?.();
    });

    source.addEventListener('sync', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as {
          eventType: string;
          activity: ActivityEvent | null;
          bootstrap: BootstrapPayload;
        };
        callbacks.onSync(parsed);
      } catch {
        // Ignore malformed frame
      }
    });

    source.onerror = () => {
      callbacks.onDisconnected?.();
    };

    return () => {
      source.close();
    };
  },
};

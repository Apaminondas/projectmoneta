import { toast } from "sonner";
import type {
  CategoryResponse,
  CategoryRequest,
  TransactionResponse,
  TransactionRequest,
  ReferencePeriodResponse,
  MonthlySummaryResponse,
  CategoryReportResponse,
} from "@/types/api";

export interface DemoModeResponse {
  mode: "readonly" | "sandbox";
}

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

function genericErrorMessage(method?: string): string {
  const upper = (method ?? "GET").toUpperCase();
  if (upper === "GET" || upper === "HEAD") {
    return "Não foi possível carregar";
  }
  return "Não foi possível concluir a operação";
}

async function bffRequest<T>(
  bffPath: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(bffPath, {
      ...options,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(genericErrorMessage(options.method), 503);
  }

  if (!response.ok) {
    interface BffErrorPayload {
      code?: unknown;
      message?: unknown;
      fields?: Array<{ field?: unknown; message?: unknown }>;
    }
    let errorData: BffErrorPayload | null = null;

    const errContentType = response.headers.get("content-type") ?? "";
    if (errContentType.includes("application/json")) {
      try {
        errorData = (await response.json()) as BffErrorPayload;
      } catch {
        errorData = null;
      }
    }

    if (response.status === 403 && errorData?.code === "DEMO_READ_ONLY") {
      if (typeof window !== "undefined") {
        toast.info("Modo demonstração: somente leitura", {
          id: "demo-read-only",
        });
      }
      throw new ApiClientError(
        "Modo demonstração: somente leitura",
        403,
        "DEMO_READ_ONLY"
      );
    }

    if (
      (response.status === 400 ||
        response.status === 409 ||
        response.status === 413 ||
        response.status === 422) &&
      errorData
    ) {
      const fieldMsg =
        Array.isArray(errorData.fields) &&
        typeof errorData.fields[0]?.message === "string"
          ? errorData.fields[0].message
          : null;
      const domainMsg =
        fieldMsg ||
        (typeof errorData.message === "string" ? errorData.message : null) ||
        genericErrorMessage(options.method);
      throw new ApiClientError(domainMsg, response.status);
    }

    if (
      (response.status === 503 || response.status === 504) &&
      typeof errorData?.message === "string"
    ) {
      throw new ApiClientError(errorData.message, response.status);
    }

    throw new ApiClientError(
      genericErrorMessage(options.method),
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  demo: {
    mode: () => bffRequest<DemoModeResponse>("/bff/demo"),
  },
  summary: {
    referencePeriod: () =>
      bffRequest<ReferencePeriodResponse>("/bff/api/summary/reference-period"),
    monthly: (year: number, month: number) =>
      bffRequest<MonthlySummaryResponse>(
        `/bff/api/summary/monthly?year=${year}&month=${month}`
      ),
    categoryReport: (startDate: string, endDate: string) =>
      bffRequest<CategoryReportResponse>(
        `/bff/api/reports/categories?startDate=${startDate}&endDate=${endDate}`
      ),
    monthlyPdfUrl: (year: number, month: number) =>
      `/bff/api/reports/monthly/pdf?year=${year}&month=${month}`,
  },
  transactions: {
    list: (params?: {
      startDate?: string;
      endDate?: string;
      categoryId?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.startDate) query.append("startDate", params.startDate);
      if (params?.endDate) query.append("endDate", params.endDate);
      if (params?.categoryId)
        query.append("categoryId", String(params.categoryId));
      const qs = query.toString();
      return bffRequest<TransactionResponse[]>(
        `/bff/api/transactions${qs ? `?${qs}` : ""}`
      );
    },
    create: (data: TransactionRequest) =>
      bffRequest<TransactionResponse>("/bff/api/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: TransactionRequest) =>
      bffRequest<TransactionResponse>(`/bff/api/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number): Promise<void> =>
      bffRequest<void>(`/bff/api/transactions/${id}`, {
        method: "DELETE",
      }),
  },
  categories: {
    list: () => bffRequest<CategoryResponse[]>("/bff/api/categories"),
    create: (data: CategoryRequest) =>
      bffRequest<CategoryResponse>("/bff/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: CategoryRequest) =>
      bffRequest<CategoryResponse>(`/bff/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  accounts: {
    list: (params?: {
      tier?: string;
      q?: string;
      includeArchived?: boolean;
    }) => {
      const query = new URLSearchParams();
      if (params?.tier) query.append("tier", params.tier);
      if (params?.q) query.append("q", params.q);
      if (params?.includeArchived) query.append("includeArchived", "true");
      const qs = query.toString();
      return bffRequest<import("@/types/api").Account[]>(
        `/bff/api/accounts${qs ? `?${qs}` : ""}`
      );
    },
    summary: (params?: { startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams();
      if (params?.startDate) query.append("startDate", params.startDate);
      if (params?.endDate) query.append("endDate", params.endDate);
      const qs = query.toString();
      return bffRequest<import("@/types/api").AccountSummary>(
        `/bff/api/accounts/summary${qs ? `?${qs}` : ""}`
      );
    },
    get: (id: number) =>
      bffRequest<import("@/types/api").Account>(`/bff/api/accounts/${id}`),
    create: (data: import("@/types/api").AccountRequest) =>
      bffRequest<import("@/types/api").Account>("/bff/api/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: import("@/types/api").AccountRequest) =>
      bffRequest<import("@/types/api").Account>(`/bff/api/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    archive: (id: number): Promise<void> =>
      bffRequest<void>(`/bff/api/accounts/${id}`, {
        method: "DELETE",
      }),
    listAppointments: (accountId: number) =>
      bffRequest<import("@/types/api").Appointment[]>(
        `/bff/api/accounts/${accountId}/appointments`
      ),
    createAppointment: (
      accountId: number,
      data: import("@/types/api").AppointmentRequest
    ) =>
      bffRequest<import("@/types/api").Appointment>(
        `/bff/api/accounts/${accountId}/appointments`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    updateAppointment: (
      accountId: number,
      apptId: number,
      data: import("@/types/api").AppointmentRequest
    ) =>
      bffRequest<import("@/types/api").Appointment>(
        `/bff/api/accounts/${accountId}/appointments/${apptId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),
    deleteAppointment: (accountId: number, apptId: number): Promise<void> =>
      bffRequest<void>(
        `/bff/api/accounts/${accountId}/appointments/${apptId}`,
        {
          method: "DELETE",
        }
      ),
  },
  contacts: {
    update: (id: number, data: import("@/types/api").ContactRequest) =>
      bffRequest<import("@/types/api").Contact>(`/bff/api/contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  budget: {
    get: async (params?: { startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams();
      if (params?.startDate) query.append("startDate", params.startDate);
      if (params?.endDate) query.append("endDate", params.endDate);
      const qs = query.toString();
      return bffRequest<import("@/types/api").BudgetResponse>(
        `/bff/api/budget${qs ? `?${qs}` : ""}`
      );
    },
    update: (
      categoryId: number,
      data: import("@/types/api").CostCenterUpdateRequest
    ) =>
      bffRequest<import("@/types/api").CostCenter>(
        `/bff/api/budget/${categoryId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),
  },
  forecast: {
    get: async (params?: {
      timeframe?: string;
      year?: number;
      month?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.timeframe) query.append("timeframe", params.timeframe);
      if (params?.year) query.append("year", String(params.year));
      if (params?.month) query.append("month", String(params.month));
      const qs = query.toString();
      return bffRequest<import("@/types/api").ForecastResponse>(
        `/bff/api/forecast${qs ? `?${qs}` : ""}`
      );
    },
    createManualRisk: (data: import("@/types/api").RiskFactorCreateRequest) =>
      bffRequest<import("@/types/api").RiskFactor>("/bff/api/forecast/risks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getMitigationPlan: (riskKey: string) =>
      bffRequest<import("@/types/api").MitigationPlan>(
        `/bff/api/forecast/mitigation/${encodeURIComponent(riskKey)}`
      ),
    saveMitigationPlan: (
      riskKey: string,
      data: import("@/types/api").MitigationPlanRequest
    ) =>
      bffRequest<import("@/types/api").MitigationPlan>(
        `/bff/api/forecast/mitigation/${encodeURIComponent(riskKey)}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),
  },
  reports: {
    dashboard: (params?: { year?: number; month?: number }) => {
      const query = new URLSearchParams();
      if (params?.year) query.append("year", String(params.year));
      if (params?.month) query.append("month", String(params.month));
      const qs = query.toString();
      return bffRequest<import("@/types/api").ReportDashboard>(
        `/bff/api/reports/dashboard${qs ? `?${qs}` : ""}`
      );
    },
    profile: () =>
      bffRequest<import("@/types/api").CompanyProfile>(
        "/bff/api/reports/profile"
      ),
    updateProfile: (data: import("@/types/api").CompanyProfileUpdateRequest) =>
      bffRequest<import("@/types/api").CompanyProfile>(
        "/bff/api/reports/profile",
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),
    uploadLogo: (file: File): Promise<import("@/types/api").CompanyProfile> => {
      const formData = new FormData();
      formData.append("file", file);
      return bffRequest<import("@/types/api").CompanyProfile>(
        "/bff/api/reports/profile/logo",
        {
          method: "POST",
          body: formData,
        }
      );
    },
    history: () =>
      bffRequest<import("@/types/api").GeneratedReport[]>(
        "/bff/api/reports/history"
      ),
    generate: (data: import("@/types/api").GenerateReportRequest) =>
      bffRequest<import("@/types/api").GeneratedReport>(
        "/bff/api/reports/generate",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    downloadReport: async (
      id: number
    ): Promise<{ blob: Blob; filename: string }> => {
      const res = await fetch(`/bff/api/reports/${id}/download`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new ApiClientError("Não foi possível carregar", res.status);
      }
      const disposition = res.headers.get("content-disposition");
      let filename = `relatorio-${id}.pdf`;
      if (disposition && disposition.includes("filename=")) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }
      const blob = await res.blob();
      return { blob, filename };
    },
  },
  users: {
    me: () =>
      bffRequest<{ id: number; name: string; email: string }>(
        "/bff/api/users/me"
      ),
  },
  notifications: {
    list: (unreadOnly?: boolean) =>
      bffRequest<import("@/types/api").NotificationItem[]>(
        `/bff/api/notifications${unreadOnly ? "?unreadOnly=true" : ""}`
      ),
    unreadCount: () =>
      bffRequest<{ unreadCount: number }>(
        "/bff/api/notifications/unread-count"
      ),
    markAsRead: (id: number) =>
      bffRequest<import("@/types/api").NotificationItem>(
        `/bff/api/notifications/${id}/read`,
        {
          method: "PUT",
        }
      ),
    markAllAsRead: () =>
      bffRequest<{ updatedCount: number }>("/bff/api/notifications/read-all", {
        method: "PUT",
      }),
    getPreferences: () =>
      bffRequest<import("@/types/api").NotificationPreferenceItem[]>(
        "/bff/api/notifications/preferences"
      ),
    updatePreferences: (
      items: import("@/types/api").NotificationPreferenceItem[]
    ) =>
      bffRequest<import("@/types/api").NotificationPreferenceItem[]>(
        "/bff/api/notifications/preferences",
        {
          method: "PUT",
          body: JSON.stringify(items),
        }
      ),
  },
  search: {
    query: (q: string) =>
      bffRequest<import("@/types/api").SearchResponse>(
        `/bff/api/search?q=${encodeURIComponent(q)}`
      ),
  },
  health: async (): Promise<boolean> => {
    try {
      const res = await fetch("/bff/health", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

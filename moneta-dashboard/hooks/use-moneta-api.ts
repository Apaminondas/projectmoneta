import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TransactionRequest, CategoryRequest } from "@/types/api";

export function useReferencePeriodQuery() {
  return useQuery({
    queryKey: ["referencePeriod"],
    queryFn: () => apiClient.summary.referencePeriod(),
    staleTime: 1000 * 60,
  });
}

export function useMonthlySummary(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ["monthlySummary", year, month],
    queryFn: () => apiClient.summary.monthly(year, month),
    enabled,
    retry: false,
  });
}

export function useTransactions(
  params?: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
  },
  enabled = true
) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => apiClient.transactions.list(params),
    enabled,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.categories.list(),
  });
}

export function useCategoryReport(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ["categoryReport", startDate, endDate],
    queryFn: () => apiClient.summary.categoryReport(startDate, endDate),
    enabled: enabled && Boolean(startDate && endDate),
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: () => apiClient.users.me(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryRequest) => apiClient.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryReport"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryRequest }) =>
      apiClient.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryReport"] });
    },
  });
}

export function useApiHealth() {
  return useQuery({
    queryKey: ["apiHealth"],
    queryFn: () => apiClient.health(),
    refetchInterval: 30000,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionRequest) => apiClient.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["referencePeriod"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["categoryReport"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionRequest }) =>
      apiClient.transactions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["referencePeriod"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["categoryReport"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["referencePeriod"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["categoryReport"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
    },
  });
}

// ========================
// CONTAS & CONTATOS
// ========================

export function useAccounts(params?: { tier?: string; q?: string; includeArchived?: boolean }) {
  return useQuery({
    queryKey: ["accounts", params?.tier, params?.q, params?.includeArchived],
    queryFn: () => apiClient.accounts.list(params),
    staleTime: 1000 * 30,
  });
}

export function useAccountsSummary(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["accountsSummary", params?.startDate, params?.endDate],
    queryFn: () => apiClient.accounts.summary(params),
    staleTime: 1000 * 30,
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => apiClient.accounts.get(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import("@/types/api").AccountRequest) => apiClient.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: import("@/types/api").AccountRequest }) =>
      apiClient.accounts.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["account", vars.id] });
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.accounts.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountsSummary"] });
    },
  });
}

export function useAccountAppointments(accountId: number) {
  return useQuery({
    queryKey: ["accountAppointments", accountId],
    queryFn: () => apiClient.accounts.listAppointments(accountId),
    enabled: !!accountId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: import("@/types/api").AppointmentRequest;
    }) => apiClient.accounts.createAppointment(accountId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["accountAppointments", vars.accountId] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      apptId,
      data,
    }: {
      accountId: number;
      apptId: number;
      data: import("@/types/api").AppointmentRequest;
    }) => apiClient.accounts.updateAppointment(accountId, apptId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["accountAppointments", vars.accountId] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, apptId }: { accountId: number; apptId: number }) =>
      apiClient.accounts.deleteAppointment(accountId, apptId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["accountAppointments", vars.accountId] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: import("@/types/api").ContactRequest }) =>
      apiClient.contacts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

// ========================
// ORÇAMENTO (BUDGET)
// ========================

export function useBudget(
  params?: { startDate?: string; endDate?: string },
  enabled = true
) {
  return useQuery({
    queryKey: ["budget", params?.startDate, params?.endDate],
    queryFn: () => apiClient.budget.get(params),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: number;
      data: import("@/types/api").CostCenterUpdateRequest;
    }) => apiClient.budget.update(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

// ========================
// PREVISÕES (FORECAST & RISKS)
// ========================

export function useForecast(
  timeframe = "6months",
  year?: number,
  month?: number,
  enabled = true
) {
  return useQuery({
    queryKey: ["forecast", timeframe, year, month],
    queryFn: () => apiClient.forecast.get({ timeframe, year, month }),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useCreateManualRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import("@/types/api").RiskFactorCreateRequest) =>
      apiClient.forecast.createManualRisk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
  });
}

export function useMitigationPlan(riskKey: string | null) {
  return useQuery({
    queryKey: ["mitigationPlan", riskKey],
    queryFn: () => (riskKey ? apiClient.forecast.getMitigationPlan(riskKey) : null),
    enabled: !!riskKey,
  });
}

export function useSaveMitigationPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      riskKey,
      data,
    }: {
      riskKey: string;
      data: import("@/types/api").MitigationPlanRequest;
    }) => apiClient.forecast.saveMitigationPlan(riskKey, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["mitigationPlan", vars.riskKey] });
      queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
  });
}

// ========================
// RELATÓRIOS (REPORTS & PROFILE)
// ========================

export function useReportsDashboard(
  params?: { year?: number; month?: number },
  enabled = true
) {
  return useQuery({
    queryKey: ["reportsDashboard", params?.year, params?.month],
    queryFn: () => apiClient.reports.dashboard(params),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useCompanyProfile() {
  return useQuery({
    queryKey: ["companyProfile"],
    queryFn: () => apiClient.reports.profile(),
    staleTime: 1000 * 60,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import("@/types/api").CompanyProfileUpdateRequest) =>
      apiClient.reports.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => apiClient.reports.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
    },
  });
}

export function useGeneratedReports() {
  return useQuery({
    queryKey: ["generatedReports"],
    queryFn: () => apiClient.reports.history(),
    staleTime: 1000 * 15,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import("@/types/api").GenerateReportRequest) =>
      apiClient.reports.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generatedReports"] });
      queryClient.invalidateQueries({ queryKey: ["reportsDashboard"] });
    },
  });
}

export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => apiClient.notifications.list(unreadOnly),
    refetchInterval: 1000 * 30,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notificationsUnreadCount"],
    queryFn: () => apiClient.notifications.unreadCount(),
    refetchInterval: 1000 * 20,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["globalSearch", query],
    queryFn: () => apiClient.search.query(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 10,
  });
}

export function useDemoMode() {
  return useQuery({
    queryKey: ["demoMode"],
    queryFn: () => apiClient.demo.mode(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => apiClient.notifications.getPreferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: import("@/types/api").NotificationPreferenceItem[]) =>
      apiClient.notifications.updatePreferences(items),
    onSuccess: (data) => {
      queryClient.setQueryData(["notificationPreferences"], data);
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });
}


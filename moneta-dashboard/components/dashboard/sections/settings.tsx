"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserIcon,
  BellIcon,
  ActivityIcon,
  MailIcon,
  SmartphoneIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { SettingsApiTab } from "./settings-api-tab";
import {
  useApiHealth,
  useUserProfile,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-moneta-api";
import type { NotificationPreferenceItem } from "@/types/api";

export function SettingsSection() {
  const [activeTab, setActiveTab] = useState("profile");

  const {
    data: isApiHealthy,
    isLoading: isCheckingHealth,
    refetch: refetchHealth,
    isRefetching: isRefetchingHealth,
  } = useApiHealth();

  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useUserProfile();

  const {
    data: serverPreferences,
    isLoading: isLoadingPreferences,
    isError: isErrorPreferences,
  } = useNotificationPreferences();

  const updatePreferencesMutation = useUpdateNotificationPreferences();

  const preferences: NotificationPreferenceItem[] = serverPreferences ?? [];

  const toggleNotification = (id: string, type: "email" | "push") => {
    const updated = preferences.map((n) =>
      n.id === id ? { ...n, [type]: !n[type] } : n
    );
    updatePreferencesMutation.mutate(updated);
  };

  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">Configurações</h2>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
          Dados do usuário, preferências de notificação, arquitetura da API e segurança
        </p>
      </div>

      {/* Status da API (/actuator/health) */}
      <Card className="border-border bg-card rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                <ActivityIcon className="w-4 h-4 text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Status da API REST
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Monitoramento em tempo real via endpoint /actuator/health
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {isCheckingHealth ? (
                <Skeleton className="h-6 w-24 rounded-lg" />
              ) : (
                <Badge
                  className={
                    isApiHealthy
                      ? "bg-success/15 text-success border-success/35 text-xs rounded-lg"
                      : "bg-destructive/15 text-destructive border-destructive/35 text-xs rounded-lg"
                  }
                >
                  {isApiHealthy ? "Operacional (UP)" : "Indisponível (DOWN)"}
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => refetchHealth()}
                disabled={isRefetchingHealth}
                className="min-h-11 sm:min-h-8 rounded-lg text-xs"
              >
                <RefreshCwIcon
                  data-icon="inline-start"
                  className={isRefetchingHealth ? "animate-spin text-accent" : undefined}
                  strokeWidth={1.5}
                />
                Verificar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary border border-border p-1 rounded-lg flex flex-wrap !h-auto w-full sm:w-fit gap-1">
          <TabsTrigger
            value="profile"
            className="!h-auto min-h-11 sm:min-h-9 py-2 px-3 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground"
          >
            <UserIcon data-icon="inline-start" className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="!h-auto min-h-11 sm:min-h-9 py-2 px-3 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground"
          >
            <BellIcon data-icon="inline-start" className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="api"
            className="!h-auto min-h-11 sm:min-h-9 py-2 px-3 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground"
          >
            <ShieldCheckIcon data-icon="inline-start" className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
            API &amp; Segurança
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab (autenticado via GET /api/users/me) */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border bg-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Informações do Usuário Autenticado
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Dados retornados pela sessão autenticada na API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                </div>
              ) : isErrorProfile || !userProfile ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Não foi possível carregar os dados do usuário autenticado.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 bg-secondary rounded-lg border border-border">
                      <AvatarFallback className="bg-accent/20 border border-accent/40 text-accent text-lg font-semibold rounded-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{userProfile.name}</p>
                      <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="userName" className="text-xs font-medium text-muted-foreground">
                        Nome
                      </Label>
                      <Input id="userName" value={userProfile.name} readOnly disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="userEmail" className="text-xs font-medium text-muted-foreground">
                        E-mail
                      </Label>
                      <Input id="userEmail" type="email" value={userProfile.email} readOnly disabled />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab (persistida via GET/PUT /api/notifications/preferences) */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border bg-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Preferências de Notificação
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Escolha como deseja receber alertas sincronizados com a API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPreferences ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : isErrorPreferences ? (
                <div className="py-8 text-center text-xs text-destructive">
                  Erro ao carregar preferências de notificação.
                </div>
              ) : preferences.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                  Sem dados no período
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-[1fr,80px,80px] gap-4 pb-3 border-b border-border text-xs font-medium text-muted-foreground">
                    <span>Tipo de Alerta</span>
                    <span className="text-center flex items-center justify-center gap-1.5">
                      <MailIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Email
                    </span>
                    <span className="text-center flex items-center justify-center gap-1.5">
                      <SmartphoneIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Push
                    </span>
                  </div>
                  {preferences.map((notification) => (
                    <div
                      key={notification.id}
                      className="grid grid-cols-[1fr,80px,80px] gap-4 py-3.5 border-b border-border last:border-0 items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{notification.label}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={notification.email}
                          disabled={updatePreferencesMutation.isPending}
                          onCheckedChange={() => toggleNotification(notification.id, "email")}
                          aria-label={`Receber ${notification.label} por e-mail`}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={notification.push}
                          disabled={updatePreferencesMutation.isPending}
                          onCheckedChange={() => toggleNotification(notification.id, "push")}
                          aria-label={`Receber ${notification.label} por push`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API & Security Tab */}
        <TabsContent value="api" className="space-y-6">
          <SettingsApiTab isApiHealthy={isApiHealthy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

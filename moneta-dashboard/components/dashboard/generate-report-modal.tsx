"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileTextIcon,
  UploadIcon,
  CheckIcon,
  AlertCircleIcon,
  Building2Icon,
  ImageIcon,
} from "lucide-react";
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
  useUploadLogo,
  useGenerateReport,
} from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateReportModal({
  open,
  onOpenChange,
}: GenerateReportModalProps) {
  const { data: profile } = useCompanyProfile();
  const updateProfileMutation = useUpdateCompanyProfile();
  const uploadLogoMutation = useUploadLogo();
  const generateReportMutation = useGenerateReport();

  const { year: refYear, month: refMonth } = useReferencePeriod();

  // Form State - Report
  const [title, setTitle] = useState("Extrato Mensal Consolidado");
  const [reportType, setReportType] = useState("MONTHLY_SUMMARY");
  const [year, setYear] = useState(refYear);
  const [month, setMonth] = useState(refMonth);
  const [reportSuccess, setReportSuccess] = useState(false);

  const periodSyncKey = `${refYear}-${refMonth}`;
  const [prevPeriodSyncKey, setPrevPeriodSyncKey] = useState(periodSyncKey);
  if (periodSyncKey !== prevPeriodSyncKey) {
    setPrevPeriodSyncKey(periodSyncKey);
    setYear(refYear);
    setMonth(refMonth);
  }

  // Form State - Company Profile
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [footerText, setFooterText] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Logo State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setCompanyName(profile.companyName || "");
      setCompanyEmail(profile.companyEmail || "");
      setCompanyPhone(profile.companyPhone || "");
      setFooterText(profile.footerText || "");
      if (profile.hasLogo && profile.logoBase64) {
        setPreviewUrl(profile.logoBase64);
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    setLogoSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (file.name.toLowerCase().endsWith(".svg") || !validTypes.includes(file.type)) {
      setLogoError("Formato inválido: apenas imagens PNG ou JPG são aceitas (SVG é rejeitado por segurança).");
      setSelectedFile(null);
      return;
    }

    if (file.size > 1024 * 1024) {
      setLogoError(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(2)} MB). O limite máximo permitido é 1 MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;
    setLogoError(null);
    try {
      await uploadLogoMutation.mutateAsync(selectedFile);
      setLogoSuccess(true);
      setTimeout(() => setLogoSuccess(false), 3000);
    } catch {
      setLogoError("Não foi possível enviar o logotipo.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        companyName: companyName.trim(),
        companyEmail: companyEmail.trim(),
        companyPhone: companyPhone.trim(),
        footerText: footerText.trim(),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileSuccess(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateReportMutation.mutateAsync({
        title: title.trim(),
        reportType,
        year,
        month,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        onOpenChange(false);
      }, 1200);
    } catch {
      setReportSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-input rounded-2xl shadow-xl text-foreground p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-accent text-accent text-xs rounded-lg">
              Motor de Relatórios
            </Badge>
            <span className="text-xs text-muted-foreground">Exportação & Identidade</span>
          </div>
          <DialogTitle className="text-base font-semibold text-foreground tracking-tight">Gerar Relatório Contábil</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Emita demonstrativos em PDF com validação e identidade visual corporativa.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-lg">
            <TabsTrigger value="generate" className="text-xs rounded-lg">
              <FileTextIcon data-icon="inline-start" strokeWidth={1.5} />
              Emitir Relatório
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs rounded-lg">
              <Building2Icon data-icon="inline-start" strokeWidth={1.5} />
              Identidade & Logotipo
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GENERATE REPORT */}
          <TabsContent value="generate" className="space-y-4 pt-3">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rep-title" className="text-xs font-medium text-muted-foreground">
                  Título do Relatório
                </Label>
                <Input
                  id="rep-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Extrato Mensal Consolidado"
                  required
                  className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Tipo de Documento</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-lg text-foreground">
                      <SelectItem value="MONTHLY_SUMMARY" className="text-xs">
                        Extrato Mensal Consolidado (PDF)
                      </SelectItem>
                      <SelectItem value="FINANCIAL_FLOW" className="text-xs">
                        Demonstrativo de Fluxo de Caixa (DRE)
                      </SelectItem>
                      <SelectItem value="COST_CENTER" className="text-xs">
                        Relatório por Centro de Custo
                      </SelectItem>
                      <SelectItem value="BALANCE_SHEET" className="text-xs">
                        Balanço Patrimonial & Investimentos
                      </SelectItem>
                      <SelectItem value="AUDIT" className="text-xs">
                        Auditoria de Lançamentos & Conciliação
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rep-month" className="text-xs font-medium text-muted-foreground">
                      Mês
                    </Label>
                    <Select
                      value={month.toString()}
                      onValueChange={(val) => setMonth(parseInt(val, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-lg text-foreground">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={m.toString()} className="text-xs">
                            {m.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rep-year" className="text-xs font-medium text-muted-foreground">
                      Ano
                    </Label>
                    <Input
                      id="rep-year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value, 10) || refYear)}
                      className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cabeçalho da Empresa:</span>
                  <span className="font-semibold text-foreground">
                    {profile?.companyName || "Moneta Corporativo"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Logotipo Customizado:</span>
                  <Badge variant="outline" className={`rounded-lg text-xs ${profile?.hasLogo ? "text-success border-success/30" : "text-muted-foreground"}`}>
                    {profile?.hasLogo ? "Ativo no PDF" : "Padrão Textual"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg border border-input bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors duration-150 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generateReportMutation.isPending || reportSuccess}
                  className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  {generateReportMutation.isPending ? (
                    "Processando PDF..."
                  ) : reportSuccess ? (
                    <span className="flex items-center gap-1.5">
                      <CheckIcon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Gerado com Sucesso!
                    </span>
                  ) : (
                    "Gerar e Salvar no Histórico"
                  )}
                </button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: COMPANY PROFILE & LOGO */}
          <TabsContent value="profile" className="space-y-4 pt-3">
            {/* Logo Upload Section */}
            <div className="p-3.5 bg-secondary/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Logotipo da Empresa</h3>
                  <p className="text-xs font-medium text-muted-foreground">
                    PNG ou JPG até 1 MB. SVG é expressamente bloqueado por segurança.
                  </p>
                </div>
                <Badge variant="outline" className={`rounded-lg text-xs ${profile?.hasLogo ? "text-success border-success/30" : "text-muted-foreground"}`}>
                  {profile?.hasLogo ? "Logotipo Salvo" : "Sem Logotipo"}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-card flex items-center justify-center overflow-hidden shrink-0">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Preview do Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-11 sm:min-h-8 rounded-lg text-xs"
                    >
                      <UploadIcon data-icon="inline-start" strokeWidth={1.5} />
                      Escolher Imagem
                    </Button>
                    {selectedFile && (
                      <Button
                        type="button"
                        onClick={handleUploadLogo}
                        disabled={uploadLogoMutation.isPending}
                        className="min-h-11 sm:min-h-8 rounded-lg bg-accent text-accent-foreground text-xs font-semibold"
                      >
                        {uploadLogoMutation.isPending ? "Validando..." : "Salvar Logo"}
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-xs font-medium text-muted-foreground">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              {logoError && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/15 text-destructive text-xs">
                  <AlertCircleIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>{logoError}</span>
                </div>
              )}

              {logoSuccess && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-success/15 text-success text-xs">
                  <CheckIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Logotipo validado e atualizado nos relatórios!</span>
                </div>
              )}
            </div>

            {/* Profile Info Form */}
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cp-name" className="text-xs font-medium text-muted-foreground">
                    Nome da Empresa
                  </Label>
                  <Input
                    id="cp-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Moneta Corporativo"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-email" className="text-xs font-medium text-muted-foreground">
                    E-mail Institucional
                  </Label>
                  <Input
                    id="cp-email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contato@moneta.corp"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cp-phone" className="text-xs font-medium text-muted-foreground">
                    Telefone Comercial
                  </Label>
                  <Input
                    id="cp-phone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+55 11 3456-7890"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-footer" className="text-xs font-medium text-muted-foreground">
                    Texto do Rodapé
                  </Label>
                  <Input
                    id="cp-footer"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Documento confidencial gerado via Moneta"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {profileSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-success">
                    <CheckIcon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Dados corporativos salvos com sucesso!
                  </span>
                ) : (
                  <span />
                )}
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="min-h-11 sm:min-h-9 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold"
                >
                  {updateProfileMutation.isPending ? "Salvando..." : "Atualizar Dados da Empresa"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

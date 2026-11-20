import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4">
        <p className="text-xs font-mono text-muted-foreground">404</p>
        <h1 className="text-lg font-semibold tracking-tight">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O endereço acessado não existe ou foi movido no Moneta.
        </p>
        <Button asChild size="sm">
          <Link href="/">Voltar para a Visão Geral</Link>
        </Button>
      </div>
    </div>
  );
}


"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4">
        <h1 className="text-lg font-semibold tracking-tight">
          Demonstração temporariamente indisponível
        </h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar esta visão agora. Tente atualizar os dados em instantes.
        </p>
        <Button type="button" size="sm" onClick={() => reset()}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}


"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPublicRuntimeConfigIssue } from "@/lib/public-runtime-config";

export default function RuntimeConfigGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const issue = getPublicRuntimeConfigIssue();

  if (!issue) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07090d] px-6 text-white">
      <Card className="w-full max-w-2xl border border-amber-400/20 bg-[#0b0e13]/96 p-8 text-white shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-amber-400/20 bg-amber-400/10 text-amber-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">环境配置错误</h1>
              <p className="text-sm leading-7 text-white/70">
                当前部署检测到公开站点正在使用本地开发环境地址，因此应用已停止继续加载，避免误把数据写到本机 Supabase 或本机后端。
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white/82">
              {issue}
            </div>

            <div className="space-y-1 text-sm leading-7 text-white/60">
              <p>请检查前端部署环境变量：</p>
              <p>`NEXT_PUBLIC_SUPABASE_URL`</p>
              <p>`NEXT_PUBLIC_SUPABASE_ANON_KEY`</p>
              <p>`NEXT_PUBLIC_BACKEND_URL`</p>
            </div>

            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 rounded-full border border-emerald-400/20 bg-emerald-400/15 px-6 text-sm font-medium text-emerald-50 hover:bg-emerald-400/22"
            >
              <RefreshCcw className="h-4 w-4" />
              {t("nav.home") ? "重新加载" : "Reload"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

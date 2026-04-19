"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCheck,
  Clock3,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  useAiExecutionCapabilities,
  useAiExecutionHistory,
  useExecuteAiAction,
} from "@/hooks/useAiExecution";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { ExecuteAiActionResult } from "@/lib/fetchers/ai-execution";

const STATUS_BADGE: Record<
  "preview" | "succeeded" | "failed" | "blocked",
  "outline" | "secondary" | "destructive" | "default"
> = {
  preview: "outline",
  succeeded: "default",
  failed: "destructive",
  blocked: "secondary",
};

function formatPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload, null, 2);
}

export default function AiExecutionSettingsSection() {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const capabilitiesQuery = useAiExecutionCapabilities(workspaceId);
  const historyQuery = useAiExecutionHistory(workspaceId, 12);
  const executeMutation = useExecuteAiAction();
  const approvalBadge = {
    AUTO: tSettings("aiExecution.badges.approval.AUTO"),
    CONFIRM: tSettings("aiExecution.badges.approval.CONFIRM"),
  } as const;
  const availabilityBadge = {
    available: tSettings("aiExecution.badges.availability.available"),
    requires_target_check: tSettings(
      "aiExecution.badges.availability.requires_target_check",
    ),
    unavailable: tSettings("aiExecution.badges.availability.unavailable"),
  } as const;
  const historyStatusLabel = {
    PREVIEW: tSettings("aiExecution.badges.historyStatus.PREVIEW"),
    SUCCEEDED: tSettings("aiExecution.badges.historyStatus.SUCCEEDED"),
    FAILED: tSettings("aiExecution.badges.historyStatus.FAILED"),
    BLOCKED: tSettings("aiExecution.badges.historyStatus.BLOCKED"),
  } as const;
  const liveStatusLabel = {
    preview: tSettings("aiExecution.badges.liveStatus.preview"),
    succeeded: tSettings("aiExecution.badges.liveStatus.succeeded"),
    failed: tSettings("aiExecution.badges.liveStatus.failed"),
    blocked: tSettings("aiExecution.badges.liveStatus.blocked"),
  } as const;
  const roleLabel = {
    OWNER: tSettings("members.roles.OWNER"),
    ADMIN: tSettings("members.roles.ADMIN"),
    MEMBER: tSettings("members.roles.MEMBER"),
  } as const;
  const targetTypeLabel = {
    WORKSPACE: tSettings("aiExecution.targetTypes.WORKSPACE"),
    PROJECT: tSettings("aiExecution.targetTypes.PROJECT"),
    ISSUE: tSettings("aiExecution.targetTypes.ISSUE"),
    WORKFLOW: tSettings("aiExecution.targetTypes.WORKFLOW"),
    DOC: tSettings("aiExecution.targetTypes.DOC"),
  } as const;

  const actions = React.useMemo(
    () => capabilitiesQuery.data?.actions ?? [],
    [capabilitiesQuery.data?.actions],
  );
  const [selectedActionKey, setSelectedActionKey] = React.useState<string>("");
  const [payloadText, setPayloadText] = React.useState("{}");
  const [payloadError, setPayloadError] = React.useState<string | null>(null);
  const [lastResult, setLastResult] = React.useState<ExecuteAiActionResult | null>(
    null,
  );

  React.useEffect(() => {
    if (!actions.length) {
      return;
    }

    setSelectedActionKey((currentKey) => {
      if (currentKey && actions.some((action) => action.key === currentKey)) {
        return currentKey;
      }

      return actions[0].key;
    });
  }, [actions]);

  const selectedAction = React.useMemo(
    () => actions.find((action) => action.key === selectedActionKey) ?? null,
    [actions, selectedActionKey],
  );

  React.useEffect(() => {
    if (!selectedAction) {
      return;
    }

    setPayloadText(formatPayload(selectedAction.sampleInput));
    setPayloadError(null);
    setLastResult(null);
  }, [selectedAction]);

  const stats = React.useMemo(() => {
    const autoCount = actions.filter(
      (action) => action.approvalMode === "AUTO",
    ).length;
    const confirmCount = actions.filter(
      (action) => action.approvalMode === "CONFIRM",
    ).length;
    const unavailableCount = actions.filter(
      (action) => action.availability.status === "unavailable",
    ).length;

    return {
      total: actions.length,
      autoCount,
      confirmCount,
      unavailableCount,
    };
  }, [actions]);

  const parsePayload = () => {
    try {
      const parsed = JSON.parse(payloadText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(tSettings("aiExecution.workbench.invalidPayload"));
      }
      setPayloadError(null);
      return parsed as Record<string, unknown>;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : tSettings("aiExecution.workbench.parseFailed");
      setPayloadError(message);
      throw error;
    }
  };

  const runAction = async (mode: "preview" | "execute" | "confirm") => {
    if (!workspaceId || !selectedAction) {
      return;
    }

    let parsedPayload: Record<string, unknown>;

    try {
      parsedPayload = parsePayload();
    } catch {
      return;
    }

    const result = await executeMutation.mutateAsync({
      workspaceId,
      actionKey: selectedAction.key,
      data: {
        input: parsedPayload,
        dryRun: mode === "preview",
        confirmed: mode === "confirm",
      },
    });

    setLastResult(result);
  };

  if (!workspaceId || !currentWorkspace) {
    return (
      <Card className="border-none">
        <CardHeader>
          <CardTitle>{tSettings("aiExecution.title")}</CardTitle>
          <CardDescription>{tSettings("aiExecution.description")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5 py-1">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>{tSettings("aiExecution.stats.total")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>{tSettings("aiExecution.stats.auto")}</CardDescription>
            <CardTitle className="text-2xl">{stats.autoCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>
              {tSettings("aiExecution.stats.confirm")}
            </CardDescription>
            <CardTitle className="text-2xl">{stats.confirmCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>
              {tSettings("aiExecution.stats.unavailable")}
            </CardDescription>
            <CardTitle className="text-2xl">{stats.unavailableCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-none">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="border border-app-border bg-app-bg/40 p-2 text-muted-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <CardTitle>{tSettings("aiExecution.capabilities.title")}</CardTitle>
              </div>
              <CardDescription className="max-w-3xl">
                {tSettings("aiExecution.capabilities.description")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                {tSettings("aiExecution.capabilities.workspaceLabel")}:{" "}
                {currentWorkspace.type === "TEAM"
                  ? tSettings("aiExecution.capabilities.workspaceType.TEAM")
                  : tSettings("aiExecution.capabilities.workspaceType.PERSONAL")}
              </Badge>
              <Badge variant="outline">
                {tSettings("aiExecution.capabilities.roleLabel")}:{" "}
                {capabilitiesQuery.data?.actorRole
                  ? roleLabel[capabilitiesQuery.data.actorRole]
                  : tCommon("feedback.loading")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {capabilitiesQuery.isLoading && (
            <div className="text-sm text-muted-foreground">
              {tSettings("aiExecution.capabilities.loading")}
            </div>
          )}
          {capabilitiesQuery.error && (
            <div className="text-sm text-destructive">
              {(capabilitiesQuery.error as Error).message ||
                tSettings("aiExecution.capabilities.loadFailed")}
            </div>
          )}
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setSelectedActionKey(action.key)}
              className={`rounded-md border px-4 py-4 text-left transition-colors ${
                selectedActionKey === action.key
                  ? "border-foreground/30 bg-app-button-hover"
                  : "border-app-border bg-app-bg/20 hover:bg-app-bg/40"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-foreground">
                  {action.label}
                </div>
                <Badge variant="outline">
                  {approvalBadge[action.approvalMode]}
                </Badge>
                <Badge variant="outline">
                  {availabilityBadge[action.availability.status]}
                </Badge>
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {action.description}
              </div>
              {action.availability.reason && (
                <div className="mt-3 text-xs leading-5 text-muted-foreground">
                  {action.availability.reason}
                </div>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="border border-app-border bg-app-bg/40 p-2 text-muted-foreground">
                <Sparkles className="size-4" />
              </div>
              <div>
                <CardTitle>{tSettings("aiExecution.workbench.title")}</CardTitle>
                <CardDescription>
                  {tSettings("aiExecution.workbench.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{tSettings("aiExecution.workbench.actionLabel")}</Label>
              <Select
                value={selectedActionKey}
                onValueChange={setSelectedActionKey}
                disabled={!actions.length}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={tSettings("aiExecution.workbench.actionPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {actions.map((action) => (
                    <SelectItem key={action.key} value={action.key}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAction && (
              <>
                <div className="rounded-md border border-app-border bg-app-bg/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-foreground">
                      {selectedAction.label}
                    </div>
                    <Badge variant="outline">
                      {approvalBadge[selectedAction.approvalMode]}
                    </Badge>
                    <Badge variant="outline">
                      {targetTypeLabel[selectedAction.targetType]}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selectedAction.description}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{tSettings("aiExecution.workbench.inputJsonLabel")}</Label>
                  <Textarea
                    value={payloadText}
                    onChange={(event) => setPayloadText(event.target.value)}
                    className="min-h-[260px] font-mono text-xs leading-6"
                    spellCheck={false}
                  />
                  {payloadError && (
                    <div className="text-sm text-destructive">{payloadError}</div>
                  )}
                </div>

                <div className="rounded-md border border-app-border bg-app-bg/20 p-4">
                  <div className="text-sm font-medium text-foreground">
                    {tSettings("aiExecution.workbench.inputFieldsTitle")}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {selectedAction.fields.map((field) => (
                      <div
                        key={field.name}
                        className="rounded-md border border-app-border bg-background/40 px-3 py-3"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {field.label}
                          {field.required && (
                            <Badge variant="outline">
                              {tSettings("aiExecution.workbench.required")}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {field.name}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-muted-foreground">
                          {field.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void runAction("preview")}
                    disabled={
                      executeMutation.isPending ||
                      selectedAction.availability.status === "unavailable"
                    }
                  >
                    <Play className="mr-2 size-4" />
                    {tSettings("aiExecution.workbench.preview")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void runAction("execute")}
                    disabled={
                      executeMutation.isPending ||
                      selectedAction.availability.status === "unavailable" ||
                      selectedAction.approvalMode === "CONFIRM"
                    }
                  >
                    <Sparkles className="mr-2 size-4" />
                    {tSettings("aiExecution.workbench.execute")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void runAction("confirm")}
                    disabled={
                      executeMutation.isPending ||
                      selectedAction.availability.status === "unavailable" ||
                      selectedAction.approvalMode !== "CONFIRM"
                    }
                  >
                    <CheckCheck className="mr-2 size-4" />
                    {tSettings("aiExecution.workbench.confirm")}
                  </Button>
                </div>

                {executeMutation.error && (
                  <div className="text-sm text-destructive">
                    {(executeMutation.error as Error).message ||
                      tSettings("aiExecution.workbench.executionFailed")}
                  </div>
                )}

                {lastResult && (
                  <div className="space-y-3 rounded-md border border-app-border bg-app-bg/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-foreground">
                        {tSettings("aiExecution.workbench.lastResult")}
                      </div>
                      <Badge variant={STATUS_BADGE[lastResult.status]}>
                        {liveStatusLabel[lastResult.status]}
                      </Badge>
                      {lastResult.needsConfirmation && (
                        <Badge variant="outline">
                          {tSettings("aiExecution.workbench.waitingConfirmation")}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm leading-6 text-muted-foreground">
                      {lastResult.message}
                    </div>
                    <Separator />
                    <pre className="overflow-auto rounded-md bg-background/60 p-3 text-xs leading-6 text-muted-foreground">
                      {JSON.stringify(lastResult, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="border border-app-border bg-app-bg/40 p-2 text-muted-foreground">
                <Clock3 className="size-4" />
              </div>
              <div>
                <CardTitle>{tSettings("aiExecution.history.title")}</CardTitle>
                <CardDescription>
                  {tSettings("aiExecution.history.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyQuery.isLoading && (
              <div className="text-sm text-muted-foreground">
                {tSettings("aiExecution.history.loading")}
              </div>
            )}
            {historyQuery.error && (
              <div className="text-sm text-destructive">
                {(historyQuery.error as Error).message ||
                  tSettings("aiExecution.history.loadFailed")}
              </div>
            )}
            {historyQuery.data?.map((record) => (
              <div
                key={record.id}
                className="rounded-md border border-app-border bg-app-bg/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {record.actionLabel}
                  </div>
                  <Badge variant="outline">
                    {historyStatusLabel[record.status]}
                  </Badge>
                  <Badge variant="outline">
                    {record.approvalMode === "AUTO"
                      ? tSettings("aiExecution.badges.historyApproval.AUTO")
                      : tSettings("aiExecution.badges.historyApproval.CONFIRM")}
                  </Badge>
                </div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  {record.summary || tSettings("aiExecution.history.noSummary")}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(record.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                {record.error?.message && (
                  <div className="mt-2 text-xs leading-5 text-destructive">
                    {record.error.message}
                  </div>
                )}
              </div>
            ))}
            {!historyQuery.isLoading &&
              !historyQuery.error &&
              historyQuery.data?.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {tSettings("aiExecution.history.empty")}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

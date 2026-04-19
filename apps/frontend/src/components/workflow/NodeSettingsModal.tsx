import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  RiCloseLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiUploadCloudLine,
  RiDownloadCloudLine,
  RiUserLine,
} from "react-icons/ri";
import { NodeType } from "./NodePanel";
import { nodeStorage } from "@/app/[locale]/(main)/workflows/_utils/node-storage";
import { generateId } from "@/app/[locale]/(main)/workflows/_utils/storage";
import SimpleColorPicker from "@/app/[locale]/(main)/workflows/_components/SimpleColorPicker";
import { useTeamMembers } from "@/hooks/useTeam";
import { useCurrentTeam } from "@/hooks/useTeam";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface NodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodes: NodeType[]) => void;
}

export default function NodeSettingsModal({
  isOpen,
  onClose,
  onSave,
}: NodeSettingsModalProps) {
  const tCommon = useTranslations("common");
  const tWorkflows = useTranslations("workflows");
  const [customNodes, setCustomNodes] = useState<NodeType[]>([]);
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [pendingDeleteNode, setPendingDeleteNode] = useState<NodeType | null>(
    null
  );
  const [newNodeForm, setNewNodeForm] = useState<Partial<NodeType>>({});

  // MARK: 获取团队成员
  const { team } = useCurrentTeam();
  const { data: teamMembers = [], isLoading: isLoadingMembers } =
    useTeamMembers(team?.id);

  useEffect(() => {
    if (isOpen) {
      setCustomNodes(nodeStorage.getAll());
      setEditingNode(null);
      setNewNodeForm({});
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewNodeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssigneeChange = (value: string) => {
    // 通过 user.id 查找成员，获取展示用名称
    const member = teamMembers.find((m) => m.user.id === value);
    const displayName =
      member?.user.name || member?.user.email.split("@")[0] || value;

    setNewNodeForm((prev) => ({
      ...prev,
      assigneeId: value,
      assigneeName: displayName,
    }));
  };

  // MARK: 保存节点
  const handleSaveNode = () => {
    if (
      !newNodeForm.label ||
      !newNodeForm.role ||
      !newNodeForm.color ||
      !newNodeForm.icon ||
      !newNodeForm.assigneeId ||
      !newNodeForm.assigneeName
    ) {
      toast.error(tWorkflows("nodeSettings.toasts.requiredFields"));
      return;
    }

    let updatedNodes: NodeType[];
    if (editingNode) {
      updatedNodes = customNodes.map((node) =>
        node.id === editingNode.id
          ? ({
              ...editingNode,
              ...newNodeForm,
              id: editingNode.id,
              assigneeId: newNodeForm.assigneeId,
              assigneeName: newNodeForm.assigneeName,
            } as NodeType)
          : node
      );
    } else {
      const newNode: NodeType = {
        id: generateId(),
        ...newNodeForm,
        assigneeId: newNodeForm.assigneeId,
        assigneeName: newNodeForm.assigneeName,
      } as NodeType;
      updatedNodes = [...customNodes, newNode];
    }

    nodeStorage.saveAll(updatedNodes);
    setCustomNodes(updatedNodes);
    setEditingNode(null);
    setNewNodeForm({});
    onSave(updatedNodes); // 通知父组件更新
  };

  // MARK: 编辑节点
  const handleEditClick = (node: NodeType) => {
    setEditingNode(node);
    setNewNodeForm({
      ...node,
      assigneeId: node.assigneeId || "",
      assigneeName: node.assigneeName || "",
    });
  };

  // MARK: 删除节点
  const handleDeleteNode = (node: NodeType) => {
    setPendingDeleteNode(node);
  };

  const handleConfirmDeleteNode = () => {
    if (!pendingDeleteNode) return;
    const updatedNodes = customNodes.filter(
      (node) => node.id !== pendingDeleteNode.id
    );
    nodeStorage.saveAll(updatedNodes);
    setCustomNodes(updatedNodes);
    onSave(updatedNodes); // 通知父组件更新
    setPendingDeleteNode(null);
  };

  // MARK: 取消编辑
  const handleCancelEdit = () => {
    setEditingNode(null);
    setNewNodeForm({});
  };

  const handleSyncToBackend = () => {
    toast.info(tWorkflows("nodeSettings.toasts.syncTodo"));
    // TODO: 实现与后端同步的逻辑
  };

  const handleImportNodes = () => {
    toast.info(tWorkflows("nodeSettings.toasts.importTodo"));
    // TODO: 实现导入节点逻辑
  };

  const handleExportNodes = () => {
    toast.info(tWorkflows("nodeSettings.toasts.exportTodo"));
    // TODO: 实现导出节点逻辑
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-black bg-opacity-50 flex items-center justify-center z-50 select-none">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text-primary">
            {tWorkflows("nodeSettings.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Node List */}
          <div>
            <h3 className="text-lg font-semibold text-app-text-primary mb-4">
              {tWorkflows("nodeSettings.existingNodes")}
            </h3>
            <div className="space-y-3 h-[85%] overflow-y-auto pr-2">
              {customNodes.length === 0 ? (
                <p className="text-app-text-muted">
                  {tWorkflows("nodeSettings.noCustomNodes")}
                </p>
              ) : (
                customNodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-3 bg-app-bg border border-app-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{node.icon}</span>
                      <div>
                        <p className="font-medium text-app-text-primary">
                          {node.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-app-text-secondary">
                            {node.role}
                          </span>
                          {node.assigneeName && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                              <RiUserLine className="w-3 h-3" />
                              {node.assigneeName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(node)}
                        className="p-1.5 text-app-text-secondary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title={tCommon("actions.edit")}
                      >
                        <RiEditLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNode(node)}
                        className="p-1.5 text-app-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title={tCommon("actions.delete")}
                      >
                        <RiDeleteBinLine className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleImportNodes}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
              >
                <RiDownloadCloudLine className="w-4 h-4" />
                {tWorkflows("nodeSettings.actions.import")}
              </button>
              <button
                onClick={handleExportNodes}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
              >
                <RiUploadCloudLine className="w-4 h-4" />
                {tWorkflows("nodeSettings.actions.export")}
              </button>
              <button
                onClick={handleSyncToBackend}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <RiSaveLine className="w-4 h-4" />
                {tWorkflows("nodeSettings.actions.sync")}
              </button>
            </div>
          </div>

          {/* Node Form */}
          <div>
            <h3 className="text-lg font-semibold text-app-text-primary mb-4">
              {editingNode
                ? tWorkflows("nodeSettings.form.editTitle")
                : tWorkflows("nodeSettings.form.createTitle")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  {tWorkflows("nodeSettings.form.nameLabel")}
                </label>
                <input
                  type="text"
                  name="label"
                  value={newNodeForm.label || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={tWorkflows("nodeSettings.form.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  {tWorkflows("nodeSettings.form.roleLabel")}
                </label>
                <input
                  type="text"
                  name="role"
                  value={newNodeForm.role || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={tWorkflows("nodeSettings.form.rolePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  {tWorkflows("nodeSettings.form.iconLabel")}
                </label>
                <input
                  type="text"
                  name="icon"
                  value={newNodeForm.icon || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={tWorkflows("nodeSettings.form.iconPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  {tWorkflows("nodeSettings.form.colorLabel")}
                </label>
                <SimpleColorPicker
                  value={newNodeForm.color || "blue"}
                  onChange={(colorValue) =>
                    setNewNodeForm((prev) => ({ ...prev, color: colorValue }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  {tWorkflows("nodeSettings.form.ownerLabel")}
                </label>
                {isLoadingMembers ? (
                  <div className="text-sm text-app-text-muted">
                    {tWorkflows("nodeSettings.form.ownerLoading")}
                  </div>
                ) : (
                  <Select
                    value={newNodeForm.assigneeId || ""}
                    onValueChange={handleAssigneeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={tWorkflows("nodeSettings.form.ownerPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5 bg-gray-200 text-xs dark:bg-gray-700">
                                {member.user.avatar_url ? (
                                  <AvatarImage
                                    src={member.user.avatar_url}
                                    alt={member.user.name || member.user.email}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-gray-200 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                  {(member.user.name || member.user.email)[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {member.user.name ||
                                  member.user.email.split("@")[0]}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-team-members" disabled>
                          {tWorkflows("nodeSettings.form.ownerMissing")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  {tWorkflows("nodeSettings.form.tagsLabel")}
                </label>
                <input
                  type="text"
                  name="tags"
                  value={(newNodeForm.tags || []).join(",")}
                  onChange={(e) =>
                    setNewNodeForm((prev) => ({
                      ...prev,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    }))
                  }
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={tWorkflows("nodeSettings.form.tagsPlaceholder")}
                />
              </div>
              <div className="flex justify-end gap-3">
                {editingNode && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
                  >
                    {tWorkflows("nodeSettings.actions.cancelEdit")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveNode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingNode
                    ? tWorkflows("nodeSettings.actions.saveEdit")
                    : tWorkflows("nodeSettings.actions.add")}
                </button>
              </div>
            </div>
          </div>
        </div>
        <Dialog
          open={Boolean(pendingDeleteNode)}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteNode(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tWorkflows("nodeSettings.deleteDialog.title")}</DialogTitle>
              <DialogDescription>
                {tWorkflows("nodeSettings.deleteDialog.description", {
                  name:
                    pendingDeleteNode?.label ||
                    tWorkflows("nodeSettings.deleteDialog.fallbackName"),
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setPendingDeleteNode(null)}
                className="rounded-md border border-app-border px-3 py-2 text-sm text-app-text-secondary transition-colors hover:bg-app-button-hover hover:text-app-text-primary"
              >
                {tCommon("actions.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteNode}
                className="rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
              >
                {tWorkflows("nodeSettings.deleteDialog.confirm")}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

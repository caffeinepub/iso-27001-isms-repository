import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import {
  type CreateGovernanceItemInput,
  GovernanceCategory,
  type GovernanceItem,
  GovernanceStatus,
  type UpdateGovernanceItemInput,
} from "../backend";
import {
  useComplianceFrameworks,
  useCreateGovernanceItem,
  useDeleteGovernanceFrameworkMapping,
  useDeleteGovernanceItem,
  useGetGovernanceAttachments,
  useGetGovernanceFrameworkMappings,
  useGovernanceItems,
  useGovernanceSummary,
  useSetGovernanceAttachment,
  useSetGovernanceFrameworkMapping,
  useUpdateGovernanceItem,
} from "../hooks/useQueries";

function statusColor(status: GovernanceStatus) {
  switch (status) {
    case GovernanceStatus.active:
      return "bg-green-500/15 text-green-400 border-green-500/30";
    case GovernanceStatus.draft:
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case GovernanceStatus.underReview:
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case GovernanceStatus.retired:
      return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

function categoryColor(cat: GovernanceCategory) {
  switch (cat) {
    case GovernanceCategory.policy:
      return "bg-purple-500/15 text-purple-400";
    case GovernanceCategory.committee:
      return "bg-blue-500/15 text-blue-400";
    case GovernanceCategory.meeting:
      return "bg-teal-500/15 text-teal-400";
    case GovernanceCategory.actionItem:
      return "bg-orange-500/15 text-orange-400";
  }
}

function categoryLabel(cat: GovernanceCategory) {
  switch (cat) {
    case GovernanceCategory.policy:
      return "Policy";
    case GovernanceCategory.committee:
      return "Committee";
    case GovernanceCategory.meeting:
      return "Meeting";
    case GovernanceCategory.actionItem:
      return "Action Item";
  }
}

const EMPTY_FORM: CreateGovernanceItemInput = {
  title: "",
  description: "",
  category: GovernanceCategory.policy,
  owner: "",
  approvedBy: "",
  reviewDate: "",
};

function GovernanceCard({
  item,
  idx,
  onEdit,
  onDelete,
  frameworkBadge,
  hasAttachment,
}: {
  item: GovernanceItem;
  idx: number;
  onEdit: (item: GovernanceItem) => void;
  onDelete: (id: bigint) => void;
  frameworkBadge?: string;
  hasAttachment?: boolean;
}) {
  return (
    <div
      data-ocid={`governance.item.${idx + 1}`}
      className="p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate">
              {item.title}
            </p>
            <Badge className={`text-[10px] ${categoryColor(item.category)}`}>
              {categoryLabel(item.category)}
            </Badge>
            <Badge className={`text-[10px] ${statusColor(item.status)}`}>
              {item.status === GovernanceStatus.underReview
                ? "Under Review"
                : item.status}
            </Badge>
            {frameworkBadge && (
              <Badge className="text-[10px] bg-blue-500/15 text-blue-400 border-blue-500/30">
                {frameworkBadge}
              </Badge>
            )}
            {hasAttachment && (
              <span title="Has attachment">
                <Paperclip className="w-3.5 h-3.5 text-green-500" />
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            {item.owner && (
              <span className="text-[11px] text-muted-foreground">
                Owner: <span className="text-foreground/70">{item.owner}</span>
              </span>
            )}
            {item.approvedBy && (
              <span className="text-[11px] text-muted-foreground">
                Approved by:{" "}
                <span className="text-foreground/70">{item.approvedBy}</span>
              </span>
            )}
            {item.reviewDate && (
              <span className="text-[11px] text-muted-foreground">
                Review:{" "}
                <span className="text-foreground/70">{item.reviewDate}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            data-ocid={`governance.edit_button.${idx + 1}`}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(item)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            data-ocid={`governance.delete_button.${idx + 1}`}
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Governance() {
  const { data: items, isLoading } = useGovernanceItems();
  const { data: summary } = useGovernanceSummary();
  const { data: complianceFrameworks } = useComplianceFrameworks();
  const createItem = useCreateGovernanceItem();
  const updateItem = useUpdateGovernanceItem();
  const deleteItem = useDeleteGovernanceItem();

  const { data: frameworkMappings = new Map() } =
    useGetGovernanceFrameworkMappings();
  const { data: attachments = new Map() } = useGetGovernanceAttachments();
  const setAttachment = useSetGovernanceAttachment();
  const setFrameworkMapping = useSetGovernanceFrameworkMapping();
  const deleteFrameworkMapping = useDeleteGovernanceFrameworkMapping();

  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GovernanceItem | null>(null);
  const [form, setForm] = useState<CreateGovernanceItemInput>(EMPTY_FORM);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState("none");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachProgress, setAttachProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (activeTab === "all") return items;
    return items.filter((i) => i.category === activeTab);
  }, [items, activeTab]);

  function openAdd() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setSelectedFrameworkId("none");
    setAttachFile(null);
    setAttachProgress(0);
    if (fileRef.current) fileRef.current.value = "";
    setDialogOpen(true);
  }

  function openEdit(item: GovernanceItem) {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      owner: item.owner,
      approvedBy: item.approvedBy,
      reviewDate: item.reviewDate,
    });
    const idStr = item.id.toString();
    const mapping = frameworkMappings.get(idStr);
    setSelectedFrameworkId(mapping ? mapping.frameworkId.toString() : "none");
    setAttachFile(null);
    setAttachProgress(0);
    if (fileRef.current) fileRef.current.value = "";
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;

    let itemId: bigint;

    if (editingItem) {
      const input: UpdateGovernanceItemInput = { id: editingItem.id, ...form };
      await updateItem.mutateAsync(input);
      itemId = editingItem.id;
    } else {
      itemId = await createItem.mutateAsync(form);
    }

    // Save/remove framework mapping
    if (selectedFrameworkId !== "none") {
      const fw = complianceFrameworks?.find(
        (f) => f.id.toString() === selectedFrameworkId,
      );
      if (fw) {
        await setFrameworkMapping.mutateAsync({
          governanceItemId: itemId,
          frameworkId: fw.id,
          frameworkName: fw.name,
        });
      }
    } else {
      await deleteFrameworkMapping.mutateAsync(itemId);
    }

    // Upload attachment if a file was selected
    if (attachFile) {
      setAttachProgress(0);
      await setAttachment.mutateAsync({
        governanceItemId: itemId,
        file: attachFile,
        onProgress: setAttachProgress,
      });
    }

    setDialogOpen(false);
  }

  const isPending =
    createItem.isPending ||
    updateItem.isPending ||
    setAttachment.isPending ||
    setFrameworkMapping.isPending;

  const summaryStats = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "Total",
        value: Number(summary.total),
        color: "text-foreground",
      },
      ...summary.byStatus.map(([status, count]) => ({
        label:
          status === GovernanceStatus.underReview
            ? "Under Review"
            : (status as string),
        value: Number(count),
        color:
          status === GovernanceStatus.active
            ? "text-green-400"
            : status === GovernanceStatus.draft
              ? "text-yellow-400"
              : status === GovernanceStatus.underReview
                ? "text-blue-400"
                : "text-slate-400",
      })),
    ];
  }, [summary]);

  const existingAttachment = editingItem
    ? attachments.get(editingItem.id.toString())
    : undefined;

  return (
    <div data-ocid="governance.page" className="p-3 sm:p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Governance
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage policies, committees, meetings, and action items
            </p>
          </div>
          <Button
            data-ocid="governance.open_modal_button"
            onClick={openAdd}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summaryStats.slice(0, 4).map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground mb-1 capitalize">
                {s.label}
              </p>
              <p className={`text-2xl font-display font-bold ${s.color}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 h-8">
          <TabsTrigger
            data-ocid="governance.all.tab"
            value="all"
            className="text-xs"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            data-ocid="governance.policy.tab"
            value={GovernanceCategory.policy}
            className="text-xs"
          >
            Policies
          </TabsTrigger>
          <TabsTrigger
            data-ocid="governance.committee.tab"
            value={GovernanceCategory.committee}
            className="text-xs"
          >
            Committees
          </TabsTrigger>
          <TabsTrigger
            data-ocid="governance.meeting.tab"
            value={GovernanceCategory.meeting}
            className="text-xs"
          >
            Meetings
          </TabsTrigger>
          <TabsTrigger
            data-ocid="governance.actionItem.tab"
            value={GovernanceCategory.actionItem}
            className="text-xs"
          >
            Action Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div data-ocid="governance.loading_state" className="space-y-3">
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-24 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="governance.empty_state"
              className="text-center py-16"
            >
              <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No governance items found
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add your first governance item
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, idx) => (
                <GovernanceCard
                  key={item.id.toString()}
                  item={item}
                  idx={idx}
                  onEdit={openEdit}
                  onDelete={(id) => deleteItem.mutate(id)}
                  frameworkBadge={
                    frameworkMappings.get(item.id.toString())?.frameworkName
                  }
                  hasAttachment={attachments.has(item.id.toString())}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="governance.dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingItem ? "Edit Governance Item" : "Add Governance Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the governance item details"
                : "Create a new governance item"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                data-ocid="governance.input"
                className="mt-1.5 h-8 text-sm"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Information Security Policy"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                data-ocid="governance.textarea"
                className="mt-1.5 text-sm resize-none"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      category: v as GovernanceCategory,
                    }))
                  }
                >
                  <SelectTrigger
                    data-ocid="governance.category.select"
                    className="mt-1.5 h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GovernanceCategory.policy}>
                      Policy
                    </SelectItem>
                    <SelectItem value={GovernanceCategory.committee}>
                      Committee
                    </SelectItem>
                    <SelectItem value={GovernanceCategory.meeting}>
                      Meeting
                    </SelectItem>
                    <SelectItem value={GovernanceCategory.actionItem}>
                      Action Item
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingItem && (
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={editingItem.status as string}
                    onValueChange={(v) =>
                      setEditingItem((p) =>
                        p ? { ...p, status: v as GovernanceStatus } : null,
                      )
                    }
                  >
                    <SelectTrigger
                      data-ocid="governance.status.select"
                      className="mt-1.5 h-8 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GovernanceStatus.active}>
                        Active
                      </SelectItem>
                      <SelectItem value={GovernanceStatus.draft}>
                        Draft
                      </SelectItem>
                      <SelectItem value={GovernanceStatus.underReview}>
                        Under Review
                      </SelectItem>
                      <SelectItem value={GovernanceStatus.retired}>
                        Retired
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Owner</Label>
                <Input
                  className="mt-1.5 h-8 text-sm"
                  value={form.owner}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, owner: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Approved By</Label>
                <Input
                  className="mt-1.5 h-8 text-sm"
                  value={form.approvedBy}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, approvedBy: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Review Date</Label>
              <Input
                type="date"
                className="mt-1.5 h-8 text-sm"
                value={form.reviewDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reviewDate: e.target.value }))
                }
              />
            </div>

            {/* Compliance Framework */}
            <div>
              <Label className="text-xs">Compliance Framework (optional)</Label>
              <Select
                value={selectedFrameworkId}
                onValueChange={setSelectedFrameworkId}
              >
                <SelectTrigger
                  data-ocid="governance.select"
                  className="mt-1.5 h-8 text-xs"
                >
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {complianceFrameworks?.map((fw) => (
                    <SelectItem key={fw.id.toString()} value={fw.id.toString()}>
                      {fw.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Attachment */}
            <div>
              <Label className="text-xs">Attachment (optional)</Label>
              {existingAttachment && !attachFile && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                  <Paperclip className="w-3 h-3 text-green-500" />
                  <span className="truncate">
                    {existingAttachment.fileName}
                  </span>
                  <span className="text-[11px] shrink-0">
                    ({(Number(existingAttachment.fileSize) / 1024).toFixed(1)}{" "}
                    KB)
                  </span>
                  <a
                    href={existingAttachment.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-primary hover:underline shrink-0"
                  >
                    View
                  </a>
                </div>
              )}
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {attachFile && (
                <p className="text-[11px] text-green-500 mt-1 flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Ready to upload: {attachFile.name}
                </p>
              )}
              {setAttachment.isPending && attachProgress > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Uploading attachment...</span>
                    <span>{Math.round(attachProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${attachProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                PDF, DOC, DOCX, PNG, JPG
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              data-ocid="governance.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              data-ocid="governance.submit_button"
              onClick={handleSubmit}
              disabled={isPending || !form.title.trim()}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

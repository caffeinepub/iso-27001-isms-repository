import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  Filter,
  Loader2,
  Paperclip,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { DocumentDetailSheet } from "../components/DocumentDetailSheet";
import { StatusBadge } from "../components/StatusBadge";
import {
  useAddUploadedDocument,
  useDeleteUploadedDocument,
  useDocuments,
  useGetUploadedDocuments,
  useIsAdmin,
} from "../hooks/useQueries";
import { type Document, DocumentStatus } from "../types/document";

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / 1024).toFixed(1)} KB`;
}

const CLAUSE_OPTIONS = [
  { value: "all", label: "All Clauses" },
  { value: "4", label: "Clause 4 – Context" },
  { value: "5", label: "Clause 5 – Leadership" },
  { value: "6", label: "Clause 6 – Planning" },
  { value: "7", label: "Clause 7 – Support" },
  { value: "8", label: "Clause 8 – Operation" },
  { value: "9", label: "Clause 9 – Performance" },
  { value: "10", label: "Clause 10 – Improvement" },
  { value: "A", label: "Annex A Controls" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: DocumentStatus.notStarted, label: "Not Started" },
  { value: DocumentStatus.inProgress, label: "In Progress" },
  { value: DocumentStatus.completed, label: "Completed" },
  { value: DocumentStatus.approved, label: "Approved" },
];

export function Documents() {
  const { data: documents, isLoading } = useDocuments();
  const { data: isAdmin } = useIsAdmin();
  const { data: uploadedDocs = [] } = useGetUploadedDocuments();
  const addDoc = useAddUploadedDocument();
  const deleteDoc = useDeleteUploadedDocument();

  const [search, setSearch] = useState("");
  const [clauseFilter, setClauseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [annexAOnly, setAnnexAOnly] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadClause, setUploadClause] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!documents) return [];
    return documents.filter((doc) => {
      const matchSearch =
        !search ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.controlName.toLowerCase().includes(search.toLowerCase());

      const matchClause =
        clauseFilter === "all" ||
        (clauseFilter === "A"
          ? doc.isAnnexA
          : doc.clauseNumber.startsWith(`${clauseFilter}.`) ||
            doc.clauseNumber === clauseFilter);

      const matchStatus = statusFilter === "all" || doc.status === statusFilter;

      const matchAnnex = !annexAOnly || doc.isAnnexA;

      return matchSearch && matchClause && matchStatus && matchAnnex;
    });
  }, [documents, search, clauseFilter, statusFilter, annexAOnly]);

  const openDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setSheetOpen(true);
  };

  function resetUpload() {
    setUploadTitle("");
    setUploadClause("");
    setUploadFile(null);
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploadProgress(0);
    await addDoc.mutateAsync({
      file: uploadFile,
      title: uploadTitle.trim(),
      clauseNumber: uploadClause.trim(),
      onProgress: setUploadProgress,
    });
    resetUpload();
    setUploadOpen(false);
  }

  const uploadedTitlesLower = useMemo(
    () => new Set(uploadedDocs.map((d) => d.title.toLowerCase())),
    [uploadedDocs],
  );

  return (
    <div data-ocid="documents.page" className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Document Repository
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              All mandatory ISMS documents per ISO 27001:2022 clauses and
              controls
            </p>
          </div>
          <Button
            data-ocid="documents.upload_button"
            onClick={() => setUploadOpen(true)}
            className="shrink-0"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </motion.div>

      {/* Uploaded Documents Section */}
      {uploadedDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary" />
            Uploaded Documents
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedDocs.map((d, idx) => (
              <div
                key={d.id.toString()}
                data-ocid={`documents.item.${idx + 1}`}
                className="p-3 rounded-lg bg-card border border-border flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {d.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {d.fileName}
                      </p>
                    </div>
                  </div>
                  <Button
                    data-ocid={`documents.delete_button.${idx + 1}`}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 hover:text-destructive"
                    onClick={() => deleteDoc.mutate(d.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {d.clauseNumber && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-primary/30 text-primary/70 py-0"
                    >
                      {d.clauseNumber}
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {formatSize(d.fileSize)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(
                      Number(d.uploadedAt / BigInt(1_000_000)),
                    ).toLocaleDateString()}
                  </span>
                </div>
                <a
                  href={d.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline w-fit"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 mb-5"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-ocid="documents.search_input"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-card border-border text-sm w-full"
          />
        </div>

        <Select value={clauseFilter} onValueChange={setClauseFilter}>
          <SelectTrigger
            data-ocid="documents.clause_filter.select"
            className="h-9 w-full sm:w-48 bg-card border-border text-sm"
          >
            <SelectValue placeholder="Filter by clause" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {CLAUSE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            data-ocid="documents.status_filter.select"
            className="h-9 w-full sm:w-44 bg-card border-border text-sm"
          >
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 h-9">
          <Switch
            id="annexa"
            checked={annexAOnly}
            onCheckedChange={setAnnexAOnly}
            className="scale-75"
          />
          <Label
            htmlFor="annexa"
            className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
          >
            Annex A only
          </Label>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-md px-3 h-9">
          <Filter className="w-3.5 h-3.5" />
          <span>{filtered.length} results</span>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-lg border border-border overflow-hidden bg-card"
      >
        <Table data-ocid="documents.table">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[280px]">
                Document Title
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Clause
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                Control
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                Owner
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                Last Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((rk) => (
                <TableRow key={rk} className="border-border">
                  {["c1", "c2", "c3", "c4", "c5", "c6"].map((ck) => (
                    <TableCell key={ck}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-16 text-muted-foreground"
                >
                  <div
                    data-ocid="documents.empty_state"
                    className="flex flex-col items-center gap-2"
                  >
                    <FileText className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No documents match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc, idx) => (
                <TableRow
                  key={doc.id.toString()}
                  data-ocid={`documents.row.item.${idx + 1}`}
                  className="border-border cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => openDocument(doc)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-3 h-3 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px] flex items-center gap-1.5">
                          {doc.title}
                          {uploadedTitlesLower.has(doc.title.toLowerCase()) && (
                            <Paperclip className="w-3 h-3 text-green-500 shrink-0" />
                          )}
                        </p>
                        {doc.isAnnexA && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-primary/30 text-primary/70 py-0 mt-0.5"
                          >
                            Annex A
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {doc.clauseNumber}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs font-mono text-muted-foreground">
                      {doc.controlNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                    {doc.owner}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                    {formatDate(doc.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <DocumentDetailSheet
        document={selectedDoc}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isAdmin={isAdmin ?? false}
      />

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(o) => {
          setUploadOpen(o);
          if (!o) resetUpload();
        }}
      >
        <DialogContent data-ocid="documents.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Upload Document</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                data-ocid="documents.input"
                className="mt-1.5 h-8 text-sm"
                placeholder="e.g. Information Security Policy"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Clause Number (optional)</Label>
              <Input
                className="mt-1.5 h-8 text-sm"
                placeholder="e.g. 6.1"
                value={uploadClause}
                onChange={(e) => setUploadClause(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">File *</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                className="mt-1.5 w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
              </p>
            </div>
            {addDoc.isPending && uploadProgress > 0 && (
              <div data-ocid="documents.loading_state">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Uploading to backend storage...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              data-ocid="documents.cancel_button"
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                resetUpload();
              }}
              disabled={addDoc.isPending}
            >
              Cancel
            </Button>
            <Button
              data-ocid="documents.submit_button"
              onClick={handleUpload}
              disabled={!uploadFile || !uploadTitle.trim() || addDoc.isPending}
            >
              {addDoc.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {addDoc.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

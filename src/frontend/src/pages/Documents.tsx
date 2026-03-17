import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Filter, Search } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DocumentDetailSheet } from "../components/DocumentDetailSheet";
import { StatusBadge } from "../components/StatusBadge";
import { useDocuments, useIsAdmin } from "../hooks/useQueries";
import { type Document, DocumentStatus } from "../types/document";

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [search, setSearch] = useState("");
  const [clauseFilter, setClauseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [annexAOnly, setAnnexAOnly] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  return (
    <div data-ocid="documents.page" className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Document Repository
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          All mandatory ISMS documents per ISO 27001:2022 clauses and controls
        </p>
      </motion.div>

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
                        <p className="text-sm font-medium text-foreground truncate max-w-[220px]">
                          {doc.title}
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
    </div>
  );
}

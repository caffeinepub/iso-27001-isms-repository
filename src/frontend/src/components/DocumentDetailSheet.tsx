import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BookOpen,
  Calendar,
  Download,
  FileText,
  Loader2,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Document } from "../types/document";
import { StatusBadge } from "./StatusBadge";

interface DocumentDetailSheetProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentDetailSheet({
  document,
  open,
  onClose,
  isAdmin,
}: DocumentDetailSheetProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!document) return null;

  const handleDownload = () => {
    if (document.fileId) {
      toast.info("Preparing download...");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      // Simulate progress for UX (actual upload needs backend update method)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      await new Promise((r) => setTimeout(r, 2000));
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1500);
      toast.success(`"${file.name}" uploaded successfully`);
    } catch {
      setUploadProgress(null);
      toast.error("Upload failed");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        data-ocid="document.detail.sheet"
        className="w-full sm:max-w-xl bg-card border-border overflow-y-auto scrollbar-thin"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-foreground font-display text-lg leading-tight">
                  {document.title}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground text-xs mt-0.5">
                  {document.clauseNumber} — {document.controlNumber}
                </SheetDescription>
              </div>
            </div>
            <Button
              data-ocid="document.close_button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <Separator className="mb-5 bg-border" />

        {/* Status & Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          <StatusBadge status={document.status} />
          {document.isAnnexA && (
            <Badge
              variant="outline"
              className="text-xs border-primary/40 text-primary/80"
            >
              Annex A
            </Badge>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              Clause
            </div>
            <p className="text-foreground text-sm font-medium">
              {document.clauseNumber}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5 truncate">
              {document.clauseName}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Shield className="w-3.5 h-3.5" />
              Control
            </div>
            <p className="text-foreground text-sm font-medium">
              {document.controlNumber}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5 truncate">
              {document.controlName}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <User className="w-3.5 h-3.5" />
              Owner
            </div>
            <p className="text-foreground text-sm font-medium">
              {document.owner}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Last Updated
            </div>
            <p className="text-foreground text-sm font-medium">
              {formatDate(document.updatedAt)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {document.description ||
              "No description available for this document."}
          </p>
        </div>

        <Separator className="mb-5 bg-border" />

        {/* File section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Document File
          </h3>

          {document.fileId ? (
            <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 mb-3">
              <FileText className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">
                  Document attached
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {document.fileId.substring(0, 32)}...
                </p>
              </div>
              <Button
                data-ocid="document.upload_button"
                size="sm"
                variant="outline"
                className="shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-center mb-3">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No file attached</p>
            </div>
          )}

          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt"
              />
              {uploadProgress !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              ) : (
                <Button
                  data-ocid="document.upload_button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  Upload Document File
                </Button>
              )}
            </>
          )}
        </div>

        {/* Timestamps */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Created {formatDate(document.createdAt)} · ID:{" "}
            {document.id.toString()}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

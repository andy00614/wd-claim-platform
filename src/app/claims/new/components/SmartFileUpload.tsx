"use client";

import {
  Brain,
  Camera,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AIAnalysisDialog from "./AIAnalysisDialog";
import type { AnalysisApiResponse, ExpenseAnalysisResult } from "./types";

interface ItemTypeOption {
  id: number;
  name: string;
  no: string;
}

interface CurrencyOption {
  id: number;
  name: string;
  code: string;
}

interface SmartFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onAIDataExtracted?: (data: ExpenseAnalysisResult) => void;
  itemTypes?: ItemTypeOption[];
  currencies?: CurrencyOption[];
  exchangeRates?: Record<string, number>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 返回完整的data URL格式，包含MIME类型
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SmartFileUpload({
  files,
  onFilesChange,
  onAIDataExtracted,
  itemTypes = [],
  currencies = [],
  exchangeRates = {},
}: SmartFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI分析相关状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ExpenseAnalysisResult | null>(null);
  const [currentAnalyzingFile, setCurrentAnalyzingFile] = useState<File | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const previewUrls = useMemo(
    () =>
      files.map((file) => {
        const isPreviewable =
          file.type.startsWith("image/") || file.type === "application/pdf";
        return isPreviewable ? URL.createObjectURL(file) : null;
      }),
    [files],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    addFiles(selectedFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setCurrentAnalyzingFile(file);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      // 将文件转换为base64
      const base64 = await fileToBase64(file);

      const response = await fetch("/api/ai/analyze-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64 }),
      });

      const data: AnalysisApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      if (data.success && data.data) {
        setAnalysisResult(data.data);
        setShowAnalysisDialog(true);
        toast.success("AI analysis completed!");
      } else {
        throw new Error("No analysis data received");
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setAnalysisError(errorMessage);
      setShowAnalysisDialog(true);
      toast.error("AI analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const validFiles = newFiles.filter((file) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";

        if (file.size > maxSize) {
          toast.error(`File "${file.name}" is too large. Max size is 10MB`);
          return false;
        }

        if (!isImage && !isPdf) {
          toast.error(
            `File format "${file.type || "unknown"}" is not supported. Please upload images or PDF files.`,
          );
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // 添加文件到列表
      onFilesChange([...files, ...validFiles]);

      // 自动分析第一个支持AI分析的文件
      const analyzableFile = validFiles.find(
        (file) =>
          file.type.startsWith("image/") || file.type === "application/pdf",
      );

      if (analyzableFile) {
        await analyzeFile(analyzableFile);
      }
    },
    [analyzeFile, files, onFilesChange],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const pastedFiles = items
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));

      if (pastedFiles.length === 0) return;

      event.preventDefault();
      void addFiles(pastedFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addFiles]);

  const handleAnalysisConfirm = (data: ExpenseAnalysisResult) => {
    if (onAIDataExtracted) {
      onAIDataExtracted(data);
    }
    setShowAnalysisDialog(false);
    toast.success("Data applied to form!");
  };

  const handleAnalysisReject = () => {
    setShowAnalysisDialog(false);
    toast.info("AI analysis rejected");
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <>
      <div className="bg-white border border-gray-300 p-4 mb-6">
        <h3 className="text-md font-semibold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Smart File Upload with AI Analysis
        </h3>

        {/* 分析状态显示 */}
        {isAnalyzing && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-primary">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </span>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="text-sm font-medium text-primary">
                    Analyzing {currentAnalyzingFile?.name}
                  </p>
                  <span className="text-xs text-primary/80">
                    This may take a few seconds…
                  </span>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-2.5 w-full bg-primary/10" />
                  <Skeleton className="h-2.5 w-3/4 bg-primary/5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 文件上传区域 */}
        <label
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-500 hover:bg-gray-50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          aria-label="Upload receipt files"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <UploadCloud className="mx-auto mb-3 h-8 w-8 text-primary" />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <UploadCloud className="h-4 w-4 text-primary" />
            )}
            Choose Files
          </Button>

          <p className="mt-2 text-sm text-gray-600">
            or drag and drop files here
          </p>

          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-400">
            <Camera className="h-3.5 w-3.5 text-primary" />
            <span>Images & PDFs will be automatically analyzed by AI</span>
          </p>

          <p className="text-xs text-gray-400">
            Accepted formats: Images (JPG, PNG, HEIC, etc.) and PDF (Max 10MB)
          </p>
        </label>

        {/* 已上传文件列表 */}
        {files.length > 0 && (
          <div className="mt-4">
            <div className="space-y-2">
              {files.map((file, index) => {
                const fileKey = `${file.name}-${file.lastModified}-${file.size}`;
                const isAnalyzable =
                  file.type.startsWith("image/") ||
                  file.type === "application/pdf";
                const isCurrentlyAnalyzing =
                  isAnalyzing && currentAnalyzingFile?.name === file.name;

                return (
                  <div
                    key={fileKey}
                    className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-base text-primary">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : file.type === "application/pdf" ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <Paperclip className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {file.name}
                          </span>
                          {isAnalyzable && (
                            <Brain className="h-3 w-3 text-primary" />
                          )}
                          {isCurrentlyAnalyzing && (
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600">
                          {formatFileSize(file.size)} • {file.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {previewUrls[index] && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          asChild
                        >
                          <a
                            href={previewUrls[index] ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Preview
                          </a>
                        </Button>
                      )}
                      {isAnalyzable && !isCurrentlyAnalyzing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => analyzeFile(file)}
                          disabled={isAnalyzing}
                          className="gap-1 text-xs"
                        >
                          <Brain className="h-3 w-3 text-primary" />
                          Analyze
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isAnalyzing}
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI分析结果对话框 */}
      <AIAnalysisDialog
        isOpen={showAnalysisDialog}
        onClose={() => setShowAnalysisDialog(false)}
        onConfirm={handleAnalysisConfirm}
        onReject={handleAnalysisReject}
        analysisResult={analysisResult}
        uploadedFile={currentAnalyzingFile}
        isError={!!analysisError}
        errorMessage={analysisError || undefined}
        itemTypes={itemTypes}
        currencies={currencies}
        exchangeRates={exchangeRates}
      />
    </>
  );
}

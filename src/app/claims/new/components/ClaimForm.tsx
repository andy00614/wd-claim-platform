"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  saveDraft,
  submitClaim,
  updateClaim,
  uploadClaimFiles,
  uploadItemAttachments,
} from "@/lib/actions";
import type { ExpenseItem } from "../page";
import CurrentItems from "./CurrentItems";
import ExpenseForm from "./ExpenseForm";

interface ItemType {
  id: number;
  name: string;
  no: string;
}

interface Currency {
  id: number;
  name: string;
  code: string;
}

interface ClaimFormProps {
  itemTypes: ItemType[];
  currencies: Currency[];
  exchangeRates: Record<string, number>;
  employeeId: number;
  mode?: "create" | "edit";
  initialItems?: ExpenseItem[];
  claimId?: number;
}

export default function ClaimForm({
  itemTypes,
  currencies,
  exchangeRates,
  employeeId,
  mode = "create",
  initialItems = [],
  claimId,
}: ClaimFormProps) {
  const isEditMode = mode === "edit" && typeof claimId === "number";
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(initialItems);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const expenseItemAttachments = useMemo(
    () => expenseItems.map((item) => item.attachments ?? []),
    [expenseItems],
  );
  const [actionType, setActionType] = useState<
    "submit" | "draft" | "update" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitState, submitFormAction] = useActionState(submitClaim, {
    success: false,
    error: "",
  });
  const [draftState, draftFormAction] = useActionState(saveDraft, {
    success: false,
    error: "",
  });
  const [isDraftPending, startDraftTransition] = useTransition();
  const updateActionHandler = updateClaim.bind(null, claimId ?? 0);
  const [updateState, updateFormAction] = useActionState(updateActionHandler, {
    success: false,
    error: "",
  });
  const router = useRouter();

  const addExpenseItem = (item: Omit<ExpenseItem, "id">) => {
    const newItem = {
      ...item,
      id: Date.now(),
    };
    setExpenseItems((prev) => [...prev, newItem]);
  };

  const handleEditItem = (updatedItem: ExpenseItem) => {
    setExpenseItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  useEffect(() => {
    if (isEditMode && initialItems.length > 0) {
      setExpenseItems((prev) => {
        // 只有当数据真正不同时才更新
        if (JSON.stringify(prev) !== JSON.stringify(initialItems)) {
          return initialItems;
        }
        return prev;
      });
    }
  }, [initialItems, isEditMode]);

  const removeExpenseItem = (id: number) => {
    setExpenseItems((prev) => prev.filter((item) => item.id !== id));
  };

  const currentSubmissionState = useMemo(
    () => (actionType === "submit" ? submitState : draftState),
    [actionType, draftState, submitState],
  );

  // 处理提交成功后的逻辑
  useEffect(() => {
    if (isEditMode) return;
    const currentState = currentSubmissionState;

    if (
      currentState.success &&
      currentState.data?.claimId &&
      currentState.data?.insertedItems
    ) {
      const handleFileUpload = async () => {
        try {
          // 1. 上传claim级别的附件（如果有）
          if (attachedFiles.length > 0) {
            const uploadResult = await uploadClaimFiles(
              currentState.data.claimId,
              attachedFiles,
            );
            if (!uploadResult.success) {
              toast.error(`申请文件上传失败: ${uploadResult.error}`);
            }
          }

          // 2. 上传item级别的附件
          const itemsWithAttachments = currentState.data.insertedItems
            .map((insertedItem, index) => ({
              id: insertedItem.id,
              attachments: expenseItemAttachments[index] || [],
            }))
            .filter((item) => item.attachments.length > 0);

          if (itemsWithAttachments.length > 0) {
            const itemUploadResult =
              await uploadItemAttachments(itemsWithAttachments);
            if (!itemUploadResult.success) {
              toast.error(`项目附件上传失败: ${itemUploadResult.error}`);
            }
          }

          // 清空表单
          setExpenseItems([]);
          setAttachedFiles([]);

          // 根据操作类型显示不同的成功消息
          if (actionType === "submit") {
            toast.success(
              `费用申请提交成功！申请ID: ${currentState.data?.claimId}`,
            );
            // 可以重定向到claims页面
            setTimeout(() => {
              window.location.href = "/claims";
            }, 1000);
          } else if (actionType === "draft") {
            toast.success(
              `草稿保存成功！草稿ID: ${currentState.data?.claimId}`,
            );
          }

          setActionType(null);
          setIsLoading(false);
        } catch (error) {
          console.error("File upload error:", error);
          toast.error("文件上传失败");
          setIsLoading(false);
        }
      };

      void handleFileUpload();
    }
  }, [
    actionType,
    attachedFiles,
    currentSubmissionState,
    expenseItemAttachments,
    isEditMode,
  ]);

  useEffect(() => {
    if (!isEditMode) return;

    if (updateState.success && updateState.data?.claimId) {
      toast.success(
        `Claim updated! ID: CL-2024-${updateState.data.claimId.toString().padStart(4, "0")}`,
      );
      setIsLoading(false);
      setActionType(null);
      router.push(`/claims/${updateState.data.claimId}`);
      return;
    }

    if (updateState.error) {
      toast.error(updateState.error);
      setIsLoading(false);
      setActionType(null);
    }
  }, [
    isEditMode,
    updateState.success,
    updateState.data?.claimId,
    updateState.error,
    router,
  ]);

  const totalSGD = expenseItems.reduce((sum, item) => sum + item.sgdAmount, 0);

  // 处理提交申请
  const handleSubmit = async (formData: FormData) => {
    setActionType("submit");
    setIsLoading(true);
    submitFormAction(formData);
  };

  // 处理保存草稿
  const handleSaveDraft = async (formData: FormData) => {
    setActionType("draft");
    setIsLoading(true);
    startDraftTransition(() => {
      draftFormAction(formData);
    });
  };

  // 处理按钮点击
  const handleSubmitClick = () => {
    if (isEditMode) {
      setActionType("update");
      setIsLoading(true);
      (
        document.getElementById("update-form") as HTMLFormElement
      )?.requestSubmit();
      return;
    }

    setIsLoading(true);
    (
      document.getElementById("submit-form") as HTMLFormElement
    )?.requestSubmit();
  };

  const handleDraftClick = () => {
    if (isEditMode || expenseItems.length === 0 || isLoading) return;
    const formData = new FormData();
    formData.append("employeeId", String(employeeId));
    formData.append("expenseItems", expenseItemsPayload);
    void handleSaveDraft(formData);
  };

  const currentError = isEditMode
    ? updateState.error
    : submitState.error || draftState.error;

  const expenseItemsPayload = useMemo(
    () =>
      JSON.stringify(
        expenseItems.map((item) => ({
          date: item.date,
          itemNo: item.itemNo,
          details: item.details,
          currency: item.currency,
          amount: item.amount,
          rate: item.rate,
          sgdAmount: item.sgdAmount,
        })),
      ),
    [expenseItems],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-6">
        {/* Hidden forms for server actions */}
        {!isEditMode && (
          <form id="submit-form" action={handleSubmit} className="hidden">
            <input type="hidden" name="employeeId" value={employeeId} />
            <input
              type="hidden"
              name="expenseItems"
              value={expenseItemsPayload}
            />
          </form>
        )}

        {isEditMode && (
          <form id="update-form" action={updateFormAction} className="hidden">
            <input
              type="hidden"
              name="expenseItems"
              value={expenseItemsPayload}
            />
          </form>
        )}

        {/* 费用详情表单 */}
        <ExpenseForm
          itemTypes={itemTypes}
          currencies={currencies}
          exchangeRates={exchangeRates}
          onAddItem={addExpenseItem}
        />

        {/* 当前项目列表 */}
        <CurrentItems
          items={expenseItems}
          onRemoveItem={removeExpenseItem}
          onEditItem={handleEditItem}
          totalSGD={totalSGD}
          itemTypes={itemTypes}
          currencies={currencies}
          exchangeRates={exchangeRates}
        />

        {/* 错误提示 */}
        {currentError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{currentError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col-reverse justify-end gap-3 pt-6 sm:flex-row sm:gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            router.refresh();
            router.back();
          }}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>

        {!isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleDraftClick}
            disabled={expenseItems.length === 0 || isLoading || isDraftPending}
            className="w-full sm:w-auto gap-2 px-6 font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm hover:bg-amber-100 hover:text-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {(isLoading || isDraftPending) && actionType === "draft" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {(isLoading || isDraftPending) && actionType === "draft" ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save as Draft</span>
              </>
            )}
          </Button>
        )}

        <Button
          type="button"
          size="lg"
          onClick={handleSubmitClick}
          disabled={expenseItems.length === 0 || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading && actionType === "submit" && !isEditMode && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isLoading && actionType === "update" && isEditMode && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditMode
            ? isLoading && actionType === "update"
              ? "Updating..."
              : "Update Claim"
            : isLoading && actionType === "submit"
              ? "Submitting..."
              : "Submit Claim"}
        </Button>
      </div>
    </div>
  );
}

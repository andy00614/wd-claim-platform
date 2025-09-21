"use client";

import {
  FileText,
  MoreHorizontal,
  PencilLine,
  RotateCcw,
  SendHorizonal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteClaim, updateClaimStatus } from "@/lib/actions";

interface Claim {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: Date | null;
}

interface ActionButtonsProps {
  claim: Claim;
}

export default function ActionButtons({ claim }: ActionButtonsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<
    null | "delete" | "submit" | "revert"
  >(null);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setActionInFlight("delete");
      const result = await deleteClaim(claim.id);
      if (result.success) {
        toast.success("Claim deleted successfully");
        router.refresh();
      } else {
        toast.error(
          ("error" in result ? result.error : "Failed to delete claim") ||
            "Failed to delete claim",
        );
      }
    } catch (error) {
      toast.error("Failed to delete claim");
      console.error(error);
    } finally {
      setActionInFlight(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSubmitClaim = async () => {
    try {
      setActionInFlight("submit");
      const result = await updateClaimStatus(claim.id, "submitted");
      if (result.success) {
        toast.success("Claim submitted successfully");
        router.refresh();
      } else {
        toast.error(
          ("error" in result ? result.error : "Failed to submit claim") ||
            "Failed to submit claim",
        );
      }
    } catch (error) {
      toast.error("Failed to submit claim");
      console.error(error);
    } finally {
      setActionInFlight(null);
      setIsSubmitDialogOpen(false);
    }
  };

  const handleRevertClaim = async () => {
    try {
      setActionInFlight("revert");
      const result = await updateClaimStatus(claim.id, "draft");
      if (result.success) {
        toast.success("Claim returned to draft");
        router.refresh();
      } else {
        toast.error(
          ("error" in result ? result.error : "Failed to revert claim") ||
            "Failed to revert claim",
        );
      }
    } catch (error) {
      toast.error("Failed to revert claim");
      console.error(error);
    } finally {
      setActionInFlight(null);
      setIsRevertDialogOpen(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 border border-gray-200 shadow-lg"
      >
        <DropdownMenuItem asChild className="focus:bg-primary/10">
          <Link
            href={`/claims/${claim.id}`}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span>View Details</span>
          </Link>
        </DropdownMenuItem>

        {(claim.status === "submitted" || claim.status === "draft") && (
          <DropdownMenuItem asChild className="focus:bg-primary/10">
            <Link
              href={`/claims/new?claimId=${claim.id}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <PencilLine className="h-4 w-4 text-primary" />
              <span>Edit Claim</span>
            </Link>
          </DropdownMenuItem>
        )}

        {claim.status === "draft" && (
          <>
            <AlertDialog
              open={isSubmitDialogOpen}
              onOpenChange={setIsSubmitDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2 text-sm font-medium text-amber-600 focus:bg-amber-50"
                >
                  <SendHorizonal className="h-4 w-4" />
                  <span>Submit Claim</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Claim</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ready to submit this claim for approval? You can still make
                    changes until it is approved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSubmitClaim}
                    disabled={actionInFlight === "submit"}
                  >
                    {actionInFlight === "submit"
                      ? "Submitting..."
                      : "Confirm Submit"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenuSeparator />

            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2 text-sm font-medium text-destructive focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Claim</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this claim? This action
                    cannot be undone and all related data and attachments will
                    be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={actionInFlight === "delete"}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {actionInFlight === "delete"
                      ? "Deleting..."
                      : "Confirm Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {claim.status === "submitted" && (
          <>
            <DropdownMenuSeparator />
            <AlertDialog
              open={isRevertDialogOpen}
              onOpenChange={setIsRevertDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 focus:bg-slate-100"
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                  <span>Return to Draft</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Return Claim to Draft</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move the claim back to draft so you can make more
                    changes. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRevertClaim}
                    disabled={actionInFlight === "revert"}
                  >
                    {actionInFlight === "revert" ? "Reverting..." : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

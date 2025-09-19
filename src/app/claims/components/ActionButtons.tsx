'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
} from '@/components/ui/alert-dialog'
import { Eye, Edit, Send, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { deleteClaim } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Claim {
  id: number
  status: string
  totalAmount: string
  createdAt: Date | null
}

interface ActionButtonsProps {
  claim: Claim
}

export default function ActionButtons({ claim }: ActionButtonsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteClaim(claim.id)
      if (result.success) {
        toast.success('Claim deleted successfully')
        router.refresh()
      } else {
        toast.error('Failed to delete claim')
      }
      setIsDeleteDialogOpen(false)
    })
  }

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
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href={`/claims/${claim.id}`} className="flex items-center gap-2 cursor-pointer">
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </Link>
        </DropdownMenuItem>

        {(claim.status === 'submitted' || claim.status === 'draft') && (
          <DropdownMenuItem asChild>
            <Link href={`/claims/new?claimId=${claim.id}`} className="flex items-center gap-2 cursor-pointer">
              <Edit className="h-4 w-4" />
              <span>Edit Claim</span>
            </Link>
          </DropdownMenuItem>
        )}

        {claim.status === 'draft' && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/claims/${claim.id}/submit`} className="flex items-center gap-2 cursor-pointer text-primary">
                <Send className="h-4 w-4" />
                <span>Submit Claim</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Claim</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this claim? This action cannot be undone and all related data and attachments will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isPending}
                    variant="destructive"
                  >
                    {isPending ? 'Deleting...' : 'Confirm Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

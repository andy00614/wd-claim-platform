import { getClaimDetails } from '@/lib/actions'
import { formatClaimId } from '@/lib/utils'
import Link from 'next/link'
import dayjs from 'dayjs'
import BackButton from './components/BackButton'
import ExpenseItemsTable from '@/components/claims/ExpenseItemsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { FileText, Download, Eye, ArrowLeft, User, Calendar, DollarSign, Edit } from 'lucide-react'

interface ClaimDetailPageProps {
  params: Promise<{ id: string }>
}


export default async function ClaimDetailPage({ params }: ClaimDetailPageProps) {
  const { id } = await params
  const claimId = parseInt(id, 10)
  
  const claimData = await getClaimDetails(claimId)

  if (!claimData.success || !claimData.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertDescription className="space-y-4">
            <div>
              <h3 className="font-semibold">Failed to Load Claim</h3>
              <p className="text-sm">{claimData.error}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/claims">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Claims
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { claim, items, attachments, employee } = claimData.data

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { variant: 'default' as const, label: 'Approved' },
      submitted: { variant: 'secondary' as const, label: 'Pending' },
      draft: { variant: 'outline' as const, label: 'Draft' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <BackButton className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </BackButton>
          </Button>
          <h1 className="text-2xl font-semibold">Claim Details</h1>
        </div>

        {(claim.status === 'draft' || claim.status === 'submitted') && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/claims/new?claimId=${claim.id}`} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Claim
            </Link>
          </Button>
        )}
      </div>

      {/* Claim Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Claim Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Claim ID */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Claim ID</div>
              <div className="font-mono text-lg font-medium">
                {formatClaimId(claim.id)}
              </div>
            </div>
            
            {/* Employee */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Employee
              </div>
              <div className="space-y-1">
                <div className="font-medium">{employee.name}</div>
                <div className="text-xs text-muted-foreground">
                  EMP{employee.employeeCode.toString().padStart(3, '0')}
                </div>
              </div>
            </div>
            
            {/* Date */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </div>
              <div className="font-medium">
                {claim.createdAt ? dayjs(claim.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'}
              </div>
            </div>
            
            {/* Amount & Status */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Total Amount
              </div>
              <div className="space-y-2">
                <div className="font-mono text-lg font-semibold">
                  SGD {parseFloat(claim.totalAmount).toFixed(2)}
                </div>
                {getStatusBadge(claim.status)}
              </div>
            </div>
          </div>
          
          {/* Admin Notes if any */}
          {(claim as any).adminNotes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Admin Notes</div>
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  {(claim as any).adminNotes}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expense Items */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseItemsTable
            items={items.map((item) => ({
              id: item.id,
              date: item.date ? new Date(item.date) : null,
              itemCode: item.itemTypeNo,
              itemName: item.itemTypeName,
              description: item.note,
              details: item.details,
              currencyCode: item.currencyCode,
              amount: item.amount,
              rate: item.rate,
              sgdAmount: item.sgdAmount,
              existingAttachments: Array.isArray(item.attachments)
                ? item.attachments.map((attachment: any) => ({
                    id: attachment.id,
                    fileName: attachment.fileName,
                    url: attachment.url,
                    fileSize: attachment.fileSize,
                    fileType: attachment.fileType,
                  }))
                : [],
            }))}
          />
          
          <Separator className="my-4" />
          
          {/* Summary */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''} total
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                SGD {parseFloat(claim.totalAmount).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

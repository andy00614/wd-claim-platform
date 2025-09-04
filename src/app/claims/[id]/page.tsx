import { getClaimDetails } from '@/lib/actions'
import Link from 'next/link'
import BackButton from './components/BackButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { FileText, Download, Eye, ArrowLeft, User, Calendar, DollarSign } from 'lucide-react'

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
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <BackButton className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </BackButton>
        </Button>
        <h1 className="text-2xl font-semibold">Claim Details</h1>
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
                CL-2024-{claim.id.toString().padStart(4, '0')}
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
                {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">SGD Amount</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Attachments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-xs">{item.itemTypeNo}</div>
                        <div className="text-xs text-muted-foreground">{item.itemTypeName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={item.note || ''}>
                        {item.note || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-xs text-muted-foreground" title={item.details || ''}>
                        {item.details || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.currencyCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(item.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {parseFloat(item.rate).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {parseFloat(item.sgdAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.evidenceNo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.attachments && item.attachments.length > 0 ? (
                        <div className="space-y-1">
                          {item.attachments.map((attachment: any) => (
                            <Button
                              key={attachment.id}
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 justify-start"
                            >
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title={attachment.fileName}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[80px] text-xs">
                                  {attachment.fileName}
                                </span>
                              </a>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No files</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
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

      {/* Supporting Documents */}
      {attachments && attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents ({attachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attachments.map((attachment: any) => (
                <div key={attachment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{attachment.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {attachment.fileType} • {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a 
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                    <Button asChild size="sm">
                      <a 
                        href={attachment.url}
                        download={attachment.fileName || undefined}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
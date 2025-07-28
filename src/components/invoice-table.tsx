"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X, Edit, Trash2 } from "lucide-react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"

interface InvoiceTableProps {
  invoices: Invoice[]
  onUpdateInvoice: (id: string, updatedInvoice: Partial<Invoice>) => void
  onDeleteInvoice: (id: string) => void;
  sortColumn: keyof Invoice
  sortDirection: "asc" | "desc"
  onSort: (column: keyof Invoice) => void
}

const SortableHeader = ({
  column,
  children,
  sortColumn,
  sortDirection,
  onSort,
  className
}: {
  column: keyof Invoice
  children: React.ReactNode
  sortColumn: keyof Invoice
  sortDirection: "asc" | "desc"
  onSort: (column: keyof Invoice) => void
  className?: string
}) => {
  const isActive = sortColumn === column
  return (
    <TableHead className={cn("cursor-pointer hover:bg-gray-50 select-none", className)} onClick={() => onSort(column)}>
      <div className="flex items-center gap-1">
        {children}
        {isActive &&
          (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </div>
    </TableHead>
  )
}

export function InvoiceTable({ invoices, onUpdateInvoice, onDeleteInvoice, sortColumn, sortDirection, onSort }: InvoiceTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<Invoice>>({})

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT")
  }

  const startEditing = (invoice: Invoice) => {
    setEditingId(invoice.id)
    setEditingData(invoice)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingData({})
  }

  const saveEditing = () => {
    if (editingId && editingData) {
      onUpdateInvoice(editingId, editingData)
      setEditingId(null)
      setEditingData({})
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditing()
    } else if (e.key === "Escape") {
      cancelEditing()
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader column="number" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort}>
              Number
            </SortableHeader>
            <SortableHeader column="atcud" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort}>
              ATCUD
            </SortableHeader>
            <SortableHeader column="nif" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort}>
              NIF
            </SortableHeader>
            <SortableHeader column="date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort}>
              Date
            </SortableHeader>
            <SortableHeader className="w-24" column="amount" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort}>
              <div className="w-full text-right">
                Amount
              </div>
            </SortableHeader>
            <TableHead className="w-20">
              <div className="w-full text-center">Actions</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No invoices registered yet
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {editingId === invoice.id ? (
                    <Input
                      value={editingData.number || ""}
                      onChange={(e) => setEditingData((prev) => ({ ...prev, number: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      className="w-full"
                      placeholder="PREFIX001"
                    />
                  ) : (
                    invoice.number
                  )}
                </TableCell>
                <TableCell>
                  {editingId === invoice.id ? (
                    <Input
                      value={editingData.atcud || ""}
                      onChange={(e) => setEditingData((prev) => ({ ...prev, atcud: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      className="w-full"
                    />
                  ) : (
                    invoice.atcud
                  )}
                </TableCell>
                <TableCell>
                  {editingId === invoice.id ? (
                    <Input
                      value={editingData.nif || ""}
                      onChange={(e) => setEditingData((prev) => ({ ...prev, nif: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      className="w-full"
                    />
                  ) : (
                    invoice.nif
                  )}
                </TableCell>
                <TableCell>
                  {editingId === invoice.id ? (
                    <Input
                      type="date"
                      value={editingData.date || ""}
                      onChange={(e) => setEditingData((prev) => ({ ...prev, date: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      className="w-full"
                    />
                  ) : (
                    formatDate(invoice.date)
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === invoice.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editingData.amount || ""}
                      onChange={(e) =>
                        setEditingData((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))
                      }
                      onKeyDown={handleKeyDown}
                      className="w-full"
                    />
                  ) : (
                    formatCurrency(invoice.amount)
                  )}
                </TableCell>
                <TableCell className="flex justify-center">
                  {editingId === invoice.id ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={saveEditing}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => startEditing(invoice)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you wish to delete this invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteInvoice(invoice.id)}
                            >
                              Delete
                              </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

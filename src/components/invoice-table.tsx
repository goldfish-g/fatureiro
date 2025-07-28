"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X, Edit } from "lucide-react"
import type { Invoice } from "@/App"
import { ChevronUp, ChevronDown } from "lucide-react"

interface InvoiceTableProps {
  invoices: Invoice[]
  onUpdateInvoice: (id: string, updatedInvoice: Partial<Invoice>) => void
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
}: {
  column: keyof Invoice
  children: React.ReactNode
  sortColumn: keyof Invoice
  sortDirection: "asc" | "desc"
  onSort: (column: keyof Invoice) => void
}) => {
  const isActive = sortColumn === column
  return (
    <TableHead className="cursor-pointer hover:bg-gray-50 select-none" onClick={() => onSort(column)}>
      <div className="flex items-center gap-1">
        {children}
        {isActive &&
          (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </div>
    </TableHead>
  )
}

export function InvoiceTable({ invoices, onUpdateInvoice, sortColumn, sortDirection, onSort }: InvoiceTableProps) {
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
            <SortableHeader column="amount" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort}>
              Amount
            </SortableHeader>
            <TableHead className="w-20">Actions</TableHead>
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
                <TableCell>
                  {editingId === invoice.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={saveEditing}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => startEditing(invoice)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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

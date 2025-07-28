"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { Invoice } from "@/App"
import { INVOICE_CONFIG } from "@/lib/config"

interface AddInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddInvoice: (invoice: Omit<Invoice, "id">) => void
  nextNumber: string
  nextAtcud: string
  selectedYear: number
  selectedMonth: number
}

export function AddInvoiceDialog({
  open,
  onOpenChange,
  onAddInvoice,
  nextNumber,
  nextAtcud,
  selectedYear,
  selectedMonth,
}: AddInvoiceDialogProps) {
  const [formData, setFormData] = useState({
    number: nextNumber,
    atcud: nextAtcud,
    nif: "",
    day: new Date().getDate(),
    amount: "",
  })

  const [atcudPrefix, setAtcudPrefix] = useState<string>("ATCUD")
  const [numberPrefix, setNumberPrefix] = useState<string>(INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX)

  const amountInputRef = useRef<HTMLInputElement>(null)

  // Calculate max days in the selected month
  const getMaxDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  const maxDays = getMaxDaysInMonth(selectedYear, selectedMonth)

  // Construct full date from year, month, and day
  const getFullDate = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day)
    return date.toISOString().split("T")[0]
  }

  const currentFullDate = getFullDate(selectedYear, selectedMonth, formData.day)

  // Extract prefix from ATCUD when it changes
  useEffect(() => {
    const match = formData.atcud.match(/^(.+?)(\d+)$/)
    if (match) {
      setAtcudPrefix(match[1])
    }
  }, [formData.atcud])

  // Extract prefix from Number when it changes
  useEffect(() => {
    const match = formData.number.match(/^(.+?)(\d+)$/)
    if (match) {
      setNumberPrefix(match[1])
    }
  }, [formData.number])

  // Update form data when nextNumber or nextAtcud changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      number: nextNumber,
      atcud: nextAtcud,
    }))
  }, [nextNumber, nextAtcud])

  // Adjust day if it exceeds max days when month/year changes
  useEffect(() => {
    if (formData.day > maxDays) {
      setFormData((prev) => ({ ...prev, day: maxDays }))
    }
  }, [maxDays, formData.day])

  // Focus amount field when dialog opens
  useEffect(() => {
    if (open && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const getWeekday = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  const incrementDay = () => {
    setFormData((prev) => ({
      ...prev,
      day: prev.day >= maxDays ? 1 : prev.day + 1,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      return
    }

    const invoice = {
      number: formData.number,
      atcud: formData.atcud,
      nif: formData.nif,
      date: currentFullDate,
      amount: Number.parseFloat(formData.amount),
    }

    onAddInvoice(invoice)

    // Update form for next entry
    setFormData((prev) => ({
      number: getNextNumberWithPrefix(prev.number, numberPrefix),
      atcud: getNextAtcudWithPrefix(prev.atcud, atcudPrefix),
      nif: "", // Clear NIF
      day: prev.day, // Keep day
      amount: "", // Clear amount
    }))

    // Focus amount field for next entry
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 100)
  }

  const getNextAtcudWithPrefix = (currentAtcud: string, prefix: string) => {
    // Match everything up to the last sequence of digits
    const match = currentAtcud.match(/^(.+?)(\d+)$/)
    if (match) {
      const nextNum = Number.parseInt(match[2]) + 1
      return `${prefix}${nextNum.toString().padStart(INVOICE_CONFIG.ATCUD_LEADING_ZEROS, "0")}`
    }
    return `${prefix}${"1".padStart(INVOICE_CONFIG.ATCUD_LEADING_ZEROS, "0")}`
  }

  const getNextNumberWithPrefix = (currentNumber: string, prefix: string) => {
    // Match everything up to the last sequence of digits
    const match = currentNumber.match(/^(.+?)(\d+)$/)
    if (match) {
      const nextNum = Number.parseInt(match[2]) + 1
      return `${prefix}${nextNum.toString().padStart(INVOICE_CONFIG.NUMBER_LEADING_ZEROS, "0")}`
    }
    return `${prefix}${"1".padStart(INVOICE_CONFIG.NUMBER_LEADING_ZEROS, "0")}`
  }

  const handleAtcudChange = (value: string) => {
    setFormData((prev) => ({ ...prev, atcud: value }))

    // Extract and update prefix - match everything before the last sequence of digits
    const match = value.match(/^(.+?)(\d+)$/)
    if (match) {
      setAtcudPrefix(match[1])
    } else if (value && !/^\d+$/.test(value)) {
      // If there are no digits at the end, treat the whole thing as prefix
      setAtcudPrefix(value)
    }
  }

  const handleNumberChange = (value: string) => {
    setFormData((prev) => ({ ...prev, number: value }))

    // Extract and update prefix - match everything before the last sequence of digits
    const match = value.match(/^(.+?)(\d+)$/)
    if (match) {
      setNumberPrefix(match[1])
    } else if (value && !/^\d+$/.test(value)) {
      // If there are no digits at the end, treat the whole thing as prefix
      setNumberPrefix(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Number</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => handleNumberChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="PREFIX001"
              />
              <p className="text-xs text-muted-foreground">Current prefix: {numberPrefix}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="atcud">ATCUD</Label>
              <Input
                id="atcud"
                value={formData.atcud}
                onChange={(e) => handleAtcudChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="PREFIX001"
              />
              <p className="text-xs text-muted-foreground">Current prefix: {atcudPrefix}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nif">NIF</Label>
            <Input
              id="nif"
              value={formData.nif}
              onChange={(e) => setFormData((prev) => ({ ...prev, nif: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="Tax identification number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="day">Day</Label>
            <div className="flex items-center gap-2">
              <Input
                id="day"
                type="number"
                min="1"
                max={maxDays}
                value={formData.day}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    day: Math.min(Math.max(1, Number.parseInt(e.target.value) || 1), maxDays),
                  }))
                }
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={incrementDay} className="px-2 bg-transparent">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{getWeekday(selectedYear, selectedMonth, formData.day)}</span>
              <span>
                {selectedYear}/{selectedMonth.toString().padStart(2, "0")}/{formData.day.toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              ref={amountInputRef}
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.amount || Number.parseFloat(formData.amount) <= 0}>
              Add Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

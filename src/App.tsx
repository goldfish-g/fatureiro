"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Laptop, Moon, Plus, Sun, Folder } from "lucide-react"
import { InvoiceTable } from "@/components/invoice-table"
import { AddInvoiceDialog } from "@/components/add-invoice-dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { INVOICE_CONFIG } from "@/lib/config"
import { cn } from "./lib/utils"

export default function InvoiceRegistration() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString())
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<keyof Invoice>("number")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  // Persist theme using Electron's file system via preload API
  const [theme, setThemeState] = useState<"system" | "dark" | "light">("system")
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light")
  const [workspaceFolder, setWorkspaceFolder] = useState<string | null>(null)
  useEffect(() => {
    const themeGetter = async () => {
      const initialTheme = await window.theme.getTheme?.()
      const initialSystemTheme = await window.theme.getSystemTheme?.()
      setThemeState(initialTheme || "system")
      setSystemTheme(initialSystemTheme || "light")
    }
    const fetchWorkspace = async () => {
      const folder = await window.workspace.getFolder?.()
      setWorkspaceFolder(folder)
    }
    themeGetter()
    fetchWorkspace()
  }, [])

  // Load invoices when year/month or workspaceFolder changes
  useEffect(() => {
    if (!workspaceFolder) return
    setLoadingInvoices(true)
    window.invoices.read(selectedYear, selectedMonth).then((data) => {
      setInvoices(Array.isArray(data) ? data : [])
      setLoadingInvoices(false)
    })
  }, [selectedYear, selectedMonth, workspaceFolder])

  const handleChangeWorkspace = async () => {
    const folder = await window.workspace.pickFolder()
    if (folder) setWorkspaceFolder(folder)
  }
  const setTheme = async (newTheme: "system" | "dark" | "light") => {
    setThemeState(newTheme)
    await window.theme.setTheme(newTheme)
  }


  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const persistInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices)
    window.invoices?.write(selectedYear, selectedMonth, newInvoices)
  }

  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
    }
    persistInvoices([...invoices, newInvoice])
  }

  const updateInvoice = (id: string, updatedData: Partial<Invoice>) => {
    const updated = invoices.map((invoice) => (invoice.id === id ? { ...invoice, ...updatedData } : invoice))
    persistInvoices(updated)
  }

  const getNextNumber = () => {
    if (invoices.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX}${"1".padStart(INVOICE_CONFIG.NUMBER_LEADING_ZEROS, "0")}`

    const lastNumbers = invoices
      .map((inv) => inv.number)
      .filter((num) => num.startsWith(INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX))
      .map((num) => Number.parseInt(num.replace(INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX, "")))
      .filter((num) => !isNaN(num))

    if (lastNumbers.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX}${"1".padStart(INVOICE_CONFIG.NUMBER_LEADING_ZEROS, "0")}`
    const nextNum = Math.max(...lastNumbers) + 1
    return `${INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX}${nextNum.toString().padStart(INVOICE_CONFIG.NUMBER_LEADING_ZEROS, "0")}`
  }

  const getNextAtcud = () => {
    if (invoices.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX}${"1".padStart(INVOICE_CONFIG.ATCUD_LEADING_ZEROS, "0")}`

    const lastAtcuds = invoices
      .map((inv) => inv.atcud)
      .filter((atcud) => atcud.startsWith(INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX))
      .map((atcud) => Number.parseInt(atcud.replace(INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX, "")))
      .filter((num) => !isNaN(num))

    if (lastAtcuds.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX}${"1".padStart(INVOICE_CONFIG.ATCUD_LEADING_ZEROS, "0")}`
    const nextNum = Math.max(...lastAtcuds) + 1
    return `${INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX}${nextNum.toString().padStart(INVOICE_CONFIG.ATCUD_LEADING_ZEROS, "0")}`
  }

  const filteredAndSortedInvoices = () => {
    let filtered = invoices

    // Apply date filter first (filter by selected year and month)
    filtered = filtered.filter((invoice) => {
      const invoiceDate = new Date(invoice.date)
      const invoiceYear = invoiceDate.getFullYear()
      const invoiceMonth = invoiceDate.getMonth() + 1 // getMonth() returns 0-11, we need 1-12

      return invoiceYear === Number.parseInt(selectedYear) && invoiceMonth === Number.parseInt(selectedMonth)
    })

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((invoice) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          invoice.number.toLowerCase().includes(searchLower) ||
          invoice.atcud.toLowerCase().includes(searchLower) ||
          invoice.nif.toLowerCase().includes(searchLower) ||
          invoice.date.includes(searchTerm) ||
          invoice.amount.toString().includes(searchLower)
        )
      })
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue = a[sortColumn]
      let bValue = b[sortColumn]

      // Handle different data types
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1
      }
      return 0
    })
  }

  const handleSort = (column: keyof Invoice) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  return (
    <div className={cn("p-6 space-y-6 bg-background text-foreground w-screen h-screen", theme === "system" ? systemTheme : theme)}>
      <div className="flex w-full justify-between items-center">
        <h1 className="text-2xl font-bold">
          {workspaceFolder ? workspaceFolder.split(/[/\\]/).pop() : ""}
        </h1>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size={"icon"}
            onClick={handleChangeWorkspace}
            title="Change workspace folder"
          >
            <Folder className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size={"icon"}
            onClick={() => {
              if (theme === "system") {
                setTheme("dark")
              } else if (theme === "dark") {
                setTheme("light")
              } else {
                setTheme("system")
              }
            }}
            title="Change theme"
          >
            {theme === "system" ? <Laptop className="h-4 w-4" /> : (
              theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )
            )}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </div>

      {
        loadingInvoices ? (
          <div className="text-center text-gray-500">Loading invoices...</div>
        ) : (
          <InvoiceTable
            invoices={filteredAndSortedInvoices()}
            onUpdateInvoice={updateInvoice}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )
      }

      <AddInvoiceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddInvoice={addInvoice}
        nextNumber={getNextNumber()}
        nextAtcud={getNextAtcud()}
        selectedYear={Number.parseInt(selectedYear)}
        selectedMonth={Number.parseInt(selectedMonth)}
      />
    </div>
  )
}

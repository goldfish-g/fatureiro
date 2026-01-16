"use client";

import { useEffect, useState, useRef } from "react";
import { useStrings } from "./lib/strings-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Laptop, Moon, Plus, Sun, Folder, Languages, Volume2 } from "lucide-react";
import { InvoiceTable } from "@/components/invoice-table";
import { AddInvoiceDialog } from "@/components/add-invoice-dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { INVOICE_CONFIG } from "@/lib/config";
import { cn } from "./lib/utils";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { InvoiceSubmission } from "./components/invoice-submission";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function App() {
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [yearlyInvoices, setYearlyInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [insertMode, setInsertMode] = useState<{ active: boolean; index: number | null }>({ active: false, index: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Invoice>("number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [tab, setTab] = useState<"registration" | "submission">("registration");
  const [theme, setThemeState] = useState<"system" | "dark" | "light">(
    "system"
  );
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");
  const [workspaceFolder, setWorkspaceFolder] = useState<string | null>(null);
  const isDictatingRef = useRef(false);
  const { strings, language, setLanguage } = useStrings();
  useEffect(() => {
    const themeGetter = async () => {
      const initialTheme = await window.theme.getTheme?.();
      const initialSystemTheme = await window.theme.getSystemTheme?.();
      setThemeState(initialTheme || "system");
      setSystemTheme(initialSystemTheme || "light");
    };
    const fetchWorkspace = async () => {
      const folder = await window.workspace.getFolder?.();
      setWorkspaceFolder(folder);
    };
    themeGetter();
    fetchWorkspace();
  }, []);

  // Load invoices when year/month or workspaceFolder changes
  useEffect(() => {
    if (!workspaceFolder) return;
    setLoadingInvoices(true);
    window.invoices.read(selectedYear, selectedMonth).then((data) => {
      setInvoices(Array.isArray(data) ? data : []);
      setLoadingInvoices(false);
    });
  }, [selectedYear, selectedMonth, workspaceFolder]);

  // Load all invoices for the selected year to calculate yearly total
  useEffect(() => {
    if (!workspaceFolder) return;
    
    const loadYearlyInvoices = async () => {
      const allInvoices: Invoice[] = [];
      for (let month = 1; month <= 12; month++) {
        const data = await window.invoices.read(selectedYear, month.toString());
        if (Array.isArray(data)) {
          allInvoices.push(...data);
        }
      }
      setYearlyInvoices(allInvoices);
    };

    loadYearlyInvoices();
  }, [selectedYear, workspaceFolder, invoices]);

  const handleChangeWorkspace = async () => {
    const folder = await window.workspace.pickFolder();
    if (folder) setWorkspaceFolder(folder);
  };
  const setTheme = async (newTheme: "system" | "dark" | "light") => {
    setThemeState(newTheme);
    await window.theme.setTheme(newTheme);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: "1", label: strings["january"] || "January" },
    { value: "2", label: strings["february"] || "February" },
    { value: "3", label: strings["march"] || "March" },
    { value: "4", label: strings["april"] || "April" },
    { value: "5", label: strings["may"] || "May" },
    { value: "6", label: strings["june"] || "June" },
    { value: "7", label: strings["july"] || "July" },
    { value: "8", label: strings["august"] || "August" },
    { value: "9", label: strings["september"] || "September" },
    { value: "10", label: strings["october"] || "October" },
    { value: "11", label: strings["november"] || "November" },
    { value: "12", label: strings["december"] || "December" },
  ];

  const persistInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    window.invoices?.write(selectedYear, selectedMonth, newInvoices);
  };

  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
    };
    
    // Check if we're in insert mode
    if (insertMode.active && insertMode.index !== null) {
      // Insert at the specified index
      const updatedInvoices = [
        ...invoices.slice(0, insertMode.index),
        newInvoice,
        ...invoices.slice(insertMode.index),
      ];
      
      // Increment Number and ATCUD for all invoices from insertion point onwards
      const incrementedInvoices = updatedInvoices.map((inv, idx) => {
        if (idx <= insertMode.index!) return inv; // Keep invoices at and before insertion point unchanged
        
        const invoiceNumberMatch = inv.number.match(/^(.+?)(\d+)$/);
        const invoiceAtcudMatch = inv.atcud.match(/^(.+?)(\d+)$/);
        
        if (!invoiceNumberMatch || !invoiceAtcudMatch) return inv;
        
        const numberPrefix = invoiceNumberMatch[1];
        const numberValue = parseInt(invoiceNumberMatch[2]);
        const atcudPrefix = invoiceAtcudMatch[1];
        const atcudValue = parseInt(invoiceAtcudMatch[2]);
        
        return {
          ...inv,
          number: numberPrefix + (numberValue + 1).toString().padStart(invoiceNumberMatch[2].length, '0'),
          atcud: atcudPrefix + (atcudValue + 1).toString().padStart(invoiceAtcudMatch[2].length, '0'),
        };
      });
      
      persistInvoices(incrementedInvoices);
      
      // Reset insert mode and close dialog
      setInsertMode({ active: false, index: null });
      setIsDialogOpen(false);
    } else {
      // Normal add mode - append to end
      persistInvoices([...invoices, newInvoice]);
    }
  };

  const updateInvoice = (id: string, updatedData: Partial<Invoice>) => {
    const updated = invoices.map((invoice) =>
      invoice.id === id ? { ...invoice, ...updatedData } : invoice
    );
    persistInvoices(updated);
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter((invoice) => invoice.id !== id);
    persistInvoices(updated);
  };

  const insertInvoice = (index: number) => {
    // Set insert mode and open dialog
    setInsertMode({ active: true, index });
    setIsDialogOpen(true);
  };

  const dictateInvoices = () => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser');
      return;
    }

    // If already dictating, stop
    if (isDictatingRef.current) {
      window.speechSynthesis.cancel();
      isDictatingRef.current = false;
      return;
    }

    const sortedInvoices = filteredAndSortedInvoices();
    if (sortedInvoices.length === 0) return;

    isDictatingRef.current = true;

    // Determine language code and locale
    const langCode = language === 'pt' ? 'pt-PT' : 'en-US';
    const locale = language === 'pt' ? 'pt-PT' : 'en-US';

    // Get the appropriate voice for the language
    const getVoice = (): SpeechSynthesisVoice | null => {
      const voices = window.speechSynthesis.getVoices();
      console.log({voices})
      
      // For Portuguese, prefer Brazilian or Portugal Portuguese voices
      if (language === 'pt') {
        const ptVoice = voices.find(voice => 
          voice.lang === 'pt-PT' || voice.lang === 'pt-BR' || voice.lang.startsWith('pt')
        );
        if (ptVoice) return ptVoice;
      } else {
        // For English, prefer US English
        const enVoice = voices.find(voice => 
          voice.lang === 'en-US' || voice.lang.startsWith('en')
        );
        if (enVoice) return enVoice;
      }
      
      return voices[0] || null;
    };

    let lastDate = '';
    const utterances: SpeechSynthesisUtterance[] = [];

    sortedInvoices.forEach((invoice) => {
      // Check if date has changed
      if (invoice.date !== lastDate) {
        const date = new Date(invoice.date);
        const dateString = date.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
        const dateUtterance = new SpeechSynthesisUtterance(dateString);
        dateUtterance.lang = langCode;
        dateUtterance.rate = 0.9;
        utterances.push(dateUtterance);
        lastDate = invoice.date;
      }

      // Dictate NIF if present
      if (invoice.nif && invoice.nif.trim() !== '') {
        // Say "NIF" first
        const nifLabelUtterance = new SpeechSynthesisUtterance(strings["nif"] || "NIF");
        nifLabelUtterance.lang = langCode;
        nifLabelUtterance.rate = 0.8;
        utterances.push(nifLabelUtterance);
        
        // Split NIF into groups of 3 digits and add each as separate utterance
        const nifDigits = invoice.nif.replace(/\D/g, ''); // Remove non-digits
        for (let i = 0; i < nifDigits.length; i += 3) {
          const group = nifDigits.slice(i, i + 3);
          const groupUtterance = new SpeechSynthesisUtterance(group);
          groupUtterance.lang = langCode;
          groupUtterance.rate = 0.8;
          utterances.push(groupUtterance);
        }
      }

      // Dictate amount
      const hasDecimals = invoice.amount % 1 !== 0;
      const amountString = hasDecimals 
        ? invoice.amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : invoice.amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      const amountUtterance = new SpeechSynthesisUtterance(amountString);
      amountUtterance.lang = langCode;
      amountUtterance.rate = 0.9;
      (amountUtterance as any).isEndOfInvoice = true; // Mark as end of invoice
      utterances.push(amountUtterance);
    });

    // Function to start speaking with proper voice
    const startSpeaking = () => {
      const voice = getVoice();
      
      // Set voice for all utterances
      utterances.forEach(u => {
        u.voice = voice;
        u.lang = langCode; // Ensure lang is set even if voice isn't available
      });

      // Speak all utterances with pauses
      let currentIndex = 0;
      const speakNext = () => {
        if (!isDictatingRef.current || currentIndex >= utterances.length) {
          isDictatingRef.current = false;
          return;
        }
        
        const utterance = utterances[currentIndex];
        utterance.onend = () => {
          currentIndex++;
          // Use longer pause after end of invoice (amount)
          const delay = (utterance as any).isEndOfInvoice ? 700 : 300;
          setTimeout(speakNext, delay);
        };
        utterance.onerror = () => {
          isDictatingRef.current = false;
        };
        window.speechSynthesis.speak(utterance);
      };

      speakNext();
    };

    // Ensure voices are loaded before starting
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = startSpeaking;
    } else {
      startSpeaking();
    }
  };

  const getNextNumber = () => {
    // If in insert mode, use the template invoice number
    if (insertMode.active && insertMode.index !== null) {
      const templateInvoice = invoices[insertMode.index];
      return templateInvoice.number;
    }
    
    if (invoices.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX}${"1".padStart(
        INVOICE_CONFIG.NUMBER_LEADING_ZEROS,
        "0"
      )}`;

    const lastNumbers = invoices
      .map((inv) => inv.number)
      .filter((num) => num.startsWith(INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX))
      .map((num) =>
        Number.parseInt(num.replace(INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX, ""))
      )
      .filter((num) => !isNaN(num));

    if (lastNumbers.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX}${"1".padStart(
        INVOICE_CONFIG.NUMBER_LEADING_ZEROS,
        "0"
      )}`;
    const nextNum = Math.max(...lastNumbers) + 1;
    return `${INVOICE_CONFIG.DEFAULT_NUMBER_PREFIX}${nextNum
      .toString()
      .padStart(INVOICE_CONFIG.NUMBER_LEADING_ZEROS, "0")}`;
  };

  const getNextAtcud = () => {
    // If in insert mode, use the template invoice atcud
    if (insertMode.active && insertMode.index !== null) {
      const templateInvoice = invoices[insertMode.index];
      return templateInvoice.atcud;
    }
    
    if (invoices.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX}${"1".padStart(
        INVOICE_CONFIG.ATCUD_LEADING_ZEROS,
        "0"
      )}`;

    const lastAtcuds = invoices
      .map((inv) => inv.atcud)
      .filter((atcud) => atcud.startsWith(INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX))
      .map((atcud) =>
        Number.parseInt(atcud.replace(INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX, ""))
      )
      .filter((num) => !isNaN(num));

    if (lastAtcuds.length === 0)
      return `${INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX}${"1".padStart(
        INVOICE_CONFIG.ATCUD_LEADING_ZEROS,
        "0"
      )}`;
    const nextNum = Math.max(...lastAtcuds) + 1;
    return `${INVOICE_CONFIG.DEFAULT_ATCUD_PREFIX}${nextNum
      .toString()
      .padStart(INVOICE_CONFIG.ATCUD_LEADING_ZEROS, "0")}`;
  };

  const filteredAndSortedInvoices = () => {
    let filtered = invoices;

    // Apply date filter first (filter by selected year and month)
    filtered = filtered.filter((invoice) => {
      const invoiceDate = new Date(invoice.date);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12

      return (
        invoiceYear === Number.parseInt(selectedYear) &&
        invoiceMonth === Number.parseInt(selectedMonth)
      );
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((invoice) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          invoice.number.toLowerCase().includes(searchLower) ||
          invoice.atcud.toLowerCase().includes(searchLower) ||
          invoice.nif.toLowerCase().includes(searchLower) ||
          invoice.date.includes(searchTerm) ||
          invoice.amount.toString().includes(searchLower)
        );
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Handle different data types
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const handleSort = (column: keyof Invoice) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <div
      className={cn(
        "p-6 space-y-6 bg-background text-foreground w-screen h-screen flex flex-col",
        theme === "system" ? systemTheme : theme
      )}
    >
      <div className="flex w-full justify-between items-center">
        <h1 className="text-2xl font-bold">
          {workspaceFolder ? workspaceFolder.split(/[/\\]/).pop() : ""}
        </h1>
        <Tabs value={tab}>
          <TabsList>
            <TabsTrigger
              value="registration"
              onClick={() => setTab("registration")}
            >
              {strings["registration"] || "Registration"}
            </TabsTrigger>
            <TabsTrigger
              value="submission"
              onClick={() => setTab("submission")}
            >
              {strings["submission"] || "Submission"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size={"icon"}
            onClick={handleChangeWorkspace}
            title={strings["select_workspace"] || "Select workspace folder"}
          >
            <Folder className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size={"icon"}
            onClick={() => {
              if (theme === "system") {
                setTheme("dark");
              } else if (theme === "dark") {
                setTheme("light");
              } else {
                setTheme("system");
              }
            }}
            title={strings["change_theme"] || "Change theme"}
          >
            {theme === "system" ? (
              <Laptop className="h-4 w-4" />
            ) : theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <Select
            value={language}
            onValueChange={(val) => setLanguage(val as "en" | "pt")}
          >
            <SelectTrigger
              className="w-24"
              title={strings["language"] || "Language"}
            >
              <Languages className="h-4 w-4 mr-1 inline" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="pt">PT</SelectItem>
            </SelectContent>
          </Select>
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
          {tab === "registration" && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={strings["search_invoices"] || "Search invoices..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-4 border-border border-[1px] rounded-md px-3 py-1.5 shadow-xs cursor-help">
                <div>Total mensal:</div>
                <div className="font-bold">
                  {filteredAndSortedInvoices()
                    .reduce((acc, invoice) => acc + invoice.amount, 0)
                    .toFixed(2)}{" "}
                  €
                </div>
                <div className="text-xs">
                  ({filteredAndSortedInvoices().length} faturas)
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="tooltip-no-arrow bg-background text-foreground border border-border px-3 py-1.5 shadow-xs text-md" side={"bottom"} sideOffset={0}>
              <div className="flex items-center gap-4">
                <div>Total anual:</div>
                <div className="font-bold">
                  {yearlyInvoices
                    .reduce((acc, invoice) => acc + invoice.amount, 0)
                    .toFixed(2)}{" "}
                  €
                </div>
                <div className="text-xs">
                  ({yearlyInvoices.length} faturas)
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {tab === "registration" ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => dictateInvoices()}
              title={strings["dictate_invoices"] || "Dictate Invoices"}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => {
              setInsertMode({ active: false, index: null });
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {strings["add_invoice"] || "Add Invoice"}
            </Button>
          </div>
        ) : (
          <div />
        )}
      </div>

      {tab === "registration" ? (
        loadingInvoices ? (
          <div className="text-center text-gray-500">Loading invoices...</div>
        ) : (
          <InvoiceTable
            invoices={filteredAndSortedInvoices()}
            onUpdateInvoice={updateInvoice}
            onDeleteInvoice={deleteInvoice}
            onInsertInvoice={insertInvoice}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )
      ) : (
        <InvoiceSubmission invoices={filteredAndSortedInvoices()} />
      )}

      <AddInvoiceDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setInsertMode({ active: false, index: null });
          }
        }}
        onAddInvoice={addInvoice}
        nextNumber={getNextNumber()}
        nextAtcud={getNextAtcud()}
        selectedYear={Number.parseInt(selectedYear)}
        selectedMonth={Number.parseInt(selectedMonth)}
        theme={theme === "system" ? systemTheme : theme}
      />
    </div>
  );
}

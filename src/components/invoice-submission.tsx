import { useRef, useState } from "react"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight, MonitorPlay, Send, TextCursorInput } from "lucide-react"
import { toast } from "sonner"
import { Toggle } from "./ui/toggle"


export const InvoiceSubmission = ({
  invoices
}: {
  invoices: Invoice[]
}) => {
  const [currentInvoice, setCurrentInvoice] = useState(0);
  const currentInvoiceRef = useRef(0);
  const [autoSubmission, setAutoSubmission] = useState(false);
  const autoSubmissionRef = useRef(false);
  const webviewRef = useRef<Electron.WebviewTag>(null);

  const submitInvoice = async () => {
    if (webviewRef?.current) {
      webviewRef.current.executeJavaScript('document.getElementById("guardarDocumentoBtn").click()')
      await new Promise(r => setTimeout(r, 500));
      const alert = await webviewRef.current.executeJavaScript('document.getElementsByClassName("alert alert-error")') as HTMLElement[];
      if (alert.length > 0) {
        toast.error("Erro ao submeter a fatura. Verifique os dados preenchidos.");
        autoSubmissionRef.current = false;
        setAutoSubmission(false);
      } else {
        if (!autoSubmissionRef.current) {
          toast.success("Fatura submetida com sucesso!");
        } else if (currentInvoiceRef.current < invoices.length - 1) {
          const next = currentInvoiceRef.current + 1;
          currentInvoiceRef.current = next;
          setCurrentInvoice(next);
          await new Promise(r => setTimeout(r, 500));
          await injectInvoice(invoices[next]);
        } else {
          toast.success("Todas as faturas foram submetidas com sucesso!");
          autoSubmissionRef.current = false;
          setAutoSubmission(false);
        }
      }
    } else {
      console.error("Webview not available");
    }
  };

  const injectInvoice = async (invoice: Invoice) => {
    if (webviewRef?.current) {
      await webviewRef.current.executeJavaScript(`
        document.getElementById("nifAdquirente").value = "${invoice.nif}";
        document.getElementById("atcud").value = "${invoice.atcud}";
        document.getElementById("tipoDocumento").value = "FS";
        document.getElementById("numeroDocumento").value = "${invoice.number}";
        document.getElementById("dataEmissaoDocumento").value = "${invoice.date}";

        document.querySelector('a[onclick="editar(this)"]').click();
      `);
      await new Promise(r => setTimeout(r, 500));
      await webviewRef.current.executeJavaScript(`
        document.getElementById("taxaIvaVerba").value = "ISE";
        document.getElementById("motivoIsencao").value = "M07";
        document.getElementById("totalInput").value = "${invoice.amount.toFixed(2)}";
        document.getElementById("baseTributavelInput").value = "${invoice.amount.toFixed(2)}";

        document.getElementById("guardarDetalheLinhaModal").click();
      `);
      if (autoSubmissionRef.current) {
        await new Promise(r => setTimeout(r, 500));
        await submitInvoice();
      }
    } else {
      console.error("Webview not available");
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1">

      <Card className="flex-1 flex flex-col !p-0 overflow-clip">
        <webview
          ref={webviewRef}
          src="https://faturas.portaldasfinancas.gov.pt/registarDocumentoEmitenteForm.action"
          style={{ flex: 1, width: "100%", height: "100%" }}
          allowpopups={true}
        />
      </Card>

      <div className="flex items-center gap-4 w-full justify-between">
        <div
          className="flex items-center gap-2"
        >
          <Button
            onClick={() => {
              const prev = Math.max(currentInvoiceRef.current - 1, 0);
              currentInvoiceRef.current = prev;
              setCurrentInvoice(prev);
            }}
            disabled={currentInvoice === 0}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            className="flex items-center gap-1"
          >
            <span>Invoice</span>
            <Input
              type="number"
              min={1}
              max={invoices.length}
              value={currentInvoice + 1}
              onChange={e => {
                let val = Number(e.target.value);
                if (isNaN(val)) val = 1;
                val = Math.max(1, Math.min(val, invoices.length));
                currentInvoiceRef.current = val - 1;
                setCurrentInvoice(val - 1);
              }}
              className="input w-16 text-center"
            />
            <span>of {invoices.length}</span>
          </div>
          <Button
            onClick={() => {
              const next = Math.min(currentInvoiceRef.current + 1, invoices.length - 1);
              currentInvoiceRef.current = next;
              setCurrentInvoice(next);
            }}
            disabled={currentInvoice === invoices.length - 1}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div
          className="flex items-center gap-2"
        >
          <Toggle
            pressed={autoSubmission}
            onClick={() => {
              const newVal = !autoSubmissionRef.current;
              autoSubmissionRef.current = newVal;
              setAutoSubmission(newVal);
              injectInvoice(invoices[currentInvoice]);
            }}
            variant="outline"
            className={autoSubmission ? "!bg-foreground/30 hover:!bg-foreground/40" : ""}
          >
            <MonitorPlay />
            Auto Submeter
          </Toggle>
          <Button
            variant="outline"
            onClick={() => injectInvoice(invoices[currentInvoice])}
          >
            <TextCursorInput />
            Preencher
          </Button>
          <Button
            variant="outline"
            onClick={() => submitInvoice()}
          >
            <Send />
            Submeter
          </Button>
        </div>
      </div>
      {/* Render the current invoice details here */}
    </div>
  )

}
import { useRef } from "react";
import useState from "react-usestateref";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MonitorPlay,
  Send,
  TextCursorInput,
} from "lucide-react";
import { toast } from "sonner";
import { Toggle } from "./ui/toggle";
import { useStrings } from "@/lib/strings-context";

export const InvoiceSubmission = ({ invoices }: { invoices: Invoice[] }) => {
  const [currentInvoice, setCurrentInvoice, currentInvoiceRef] = useState(0);
  const [autoSubmission, setAutoSubmission, autoSubmissionRef] =
    useState(false);
  const [hideWebview, setHideWebview] = useState(false);
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const { strings } = useStrings();

  const submitInvoice = async () => {
    if (webviewRef?.current) {
      webviewRef.current.executeJavaScript(
        'document.getElementById("guardarDocumentoBtn").click()'
      );

      await new Promise((r) => setTimeout(r, 700));

      try {
        const alert = (await webviewRef.current.executeJavaScript(
          "Array.from(document.querySelectorAll('.alert-error:not(.hide)')).map((e) => e.innerText)"
        )) as string[];
        console.log({alert})
        if (alert.length > 0) {
          toast.error(
            `${strings["invoice_submission_error"] || "Error submitting invoice"}: ${alert[0]}`
          );
          setAutoSubmission(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }

      await new Promise((r) => setTimeout(r, 250));
      setHideWebview(true);
      await new Promise((r) => setTimeout(r, 250));
      setHideWebview(false);

      if (!autoSubmissionRef.current) {
        toast.success(
          strings["invoice_submission_success"] ||
            "Invoice submitted successfully!"
        );
        console.log("WTF");
        if (currentInvoiceRef.current < invoices.length - 1) {
          const next = currentInvoiceRef.current + 1;
          setCurrentInvoice(next);
        }
      } else if (currentInvoiceRef.current < invoices.length - 1) {
        const next = currentInvoiceRef.current + 1;
        setCurrentInvoice(next);
        await new Promise((r) => setTimeout(r, 500));
        await injectInvoice(invoices[next]);
      } else {
        toast.success(
          strings["all_invoices_submitted_successfully"] ||
            "All invoices submitted successfully!"
        );
        setAutoSubmission(false);
      }
    } else {
      toast.error(
        strings["webview_not_available"] ||
          "Webview not available for invoice submission."
      );
    }
  };

  const injectInvoice = async (invoice: Invoice) => {
    if (webviewRef?.current) {
      await webviewRef.current.executeJavaScript(`
        document.getElementById("nifAdquirente").value = "${
          !invoice.nif || invoice.nif.trim() === "" ? "999999990" : invoice.nif
        }";
        document.getElementById("atcud").value = "${invoice.atcud}";
        document.getElementById("tipoDocumento").value = "FS";
        document.getElementById("numeroDocumento").value = "${invoice.number}";
        document.getElementById("dataEmissaoDocumento").value = "${
          invoice.date
        }";

        document.querySelector('a[onclick="editar(this)"]').click();
      `);
      await new Promise((r) => setTimeout(r, 500));
      await webviewRef.current.executeJavaScript(`
        document.getElementById("taxaIvaVerba").value = "ISE";
        document.getElementById("motivoIsencao").value = "M07";
        document.getElementById("totalInput").value = "${invoice.amount.toFixed(
          2
        )}";
        document.getElementById("baseTributavelInput").value = "${invoice.amount.toFixed(
          2
        )}";

        document.getElementById("guardarDetalheLinhaModal").click();
      `);
      if (autoSubmissionRef.current) {
        await new Promise((r) => setTimeout(r, 500));
        await submitInvoice();
      }
    } else {
      toast.error(
        strings["webview_not_available"] ||
          "Webview not available for invoice injection."
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      <Card className="flex-1 flex flex-col !p-0 overflow-clip">
        {hideWebview ? (
          <div
            className="h-full w-full flex items-center justify-center bg-white"
          >
            <Loader2 className="!h-16 !w-16 animate-spin text-black" />
          </div>
        ):(
          <webview
          ref={webviewRef}
          src="https://faturas.portaldasfinancas.gov.pt/registarDocumentoEmitenteForm.action"
          style={{ flex: 1, width: "100%", height: "100%" }}
          allowpopups={true}
        />
        )}
      </Card>

      <div className="flex items-center gap-4 w-full justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              const prev = Math.max(currentInvoiceRef.current - 1, 0);
              setCurrentInvoice(prev);
            }}
            disabled={currentInvoice === 0}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <span>{strings["invoice"] || "Invoice"}:</span>
            <Input
              type="number"
              min={1}
              max={invoices.length}
              value={currentInvoice + 1}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (isNaN(val)) val = 1;
                val = Math.max(1, Math.min(val, invoices.length));
                setCurrentInvoice(val - 1);
              }}
              className="input w-16 text-center"
            />
            <span>
              {strings["of"] || "of"} {invoices.length}
            </span>
          </div>
          <Button
            onClick={() => {
              const next = Math.min(
                currentInvoiceRef.current + 1,
                invoices.length - 1
              );
              setCurrentInvoice(next);
            }}
            disabled={currentInvoice === invoices.length - 1}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Toggle
            pressed={autoSubmission}
            onClick={() => {
              const newVal = !autoSubmissionRef.current;
              setAutoSubmission(newVal);
              injectInvoice(invoices[currentInvoice]);
            }}
            variant="outline"
            className={
              autoSubmission ? "!bg-foreground/30 hover:!bg-foreground/40" : ""
            }
          >
            <MonitorPlay />
            {strings["auto_submit"] || "Auto Submit"}
          </Toggle>
          <Button
            variant="outline"
            onClick={() => injectInvoice(invoices[currentInvoice])}
          >
            <TextCursorInput />
            {strings["fill_in"] || "Fill In"}
          </Button>
          <Button variant="outline" onClick={() => submitInvoice()}>
            <Send />
            {strings["submit"] || "Submit"}
          </Button>
        </div>
      </div>
      {/* Render the current invoice details here */}
    </div>
  );
};

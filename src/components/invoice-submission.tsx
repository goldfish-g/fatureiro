import { useRef, useState } from "react"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const InvoiceSubmission = ({
  invoices
}: {
  invoices: Invoice[]
}) => {

  const [currentInvoice, setCurrentInvoice] = useState(0)
  const webviewRef = useRef<Electron.WebviewTag>(null)

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
            onClick={() => setCurrentInvoice((prev) => Math.max(prev - 1, 0))}
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
                setCurrentInvoice(val - 1);
              }}
              className="input w-16 text-center"

            />
            <span>of {invoices.length}</span>
          </div>
          <Button
            onClick={() => setCurrentInvoice((prev) => Math.min(prev + 1, invoices.length - 1))}
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
          <Button
            variant="outline"
            onClick={() => {
              if (webviewRef?.current) {
                webviewRef.current.executeJavaScript('document.getElementsByTagName("a")[0].innerHTML').then(async (result) => {
                  console.log(await result);
                });
              }
            }}
          >
            Preencher
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (webviewRef?.current) {
                webviewRef.current.executeJavaScript('document.getElementsByTagName("a")[0].innerHTML').then(async (result) => {
                  console.log(await result);
                });
              }
            }}
          >
            Submeter
          </Button>
        </div>
      </div>
      {/* Render the current invoice details here */}
    </div>
  )

}
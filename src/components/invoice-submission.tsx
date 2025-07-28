import { useRef, useState } from "react"
import { Card } from "./ui/card"

export const InvoiceSubmission = ({
  invoices
}: {
  invoices: Invoice[]
}) => {

  const [currentInvoice, setCurrentInvoice] = useState(0)
  const webviewRef = useRef<Electron.WebviewTag>(null)

  return (
    <div className="flex flex-col gap-4 flex-1">

      <Card className="flex-1 flex flex-col">
        <webview
          ref={webviewRef}
          src="https://stop-killing-games.keep-track.xyz"
          style={{ flex: 1, width: "100%", height: "100%" }}
          allowpopups={true}
        />
      </Card>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentInvoice((prev) => Math.max(prev - 1, 0))}
          disabled={currentInvoice === 0}
          className="btn"
        >
          Previous
        </button>
        <span>Invoice {currentInvoice + 1} of {invoices.length}</span>
        <button
          onClick={() => setCurrentInvoice((prev) => Math.min(prev + 1, invoices.length - 1))}
          disabled={currentInvoice === invoices.length - 1}
          className="btn"
        >
          Next
        </button>
        <button
          onClick={() => {
            if (webviewRef?.current) {
              webviewRef.current.executeJavaScript('document.getElementsByTagName("a")[0].innerHTML').then(async (result) => {
                console.log(await result);
              });
            }
          }}
          className="btn"
        >
          Test
        </button>
      </div>
      {/* Render the current invoice details here */}
    </div>
  )

}
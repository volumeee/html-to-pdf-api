const { formatRp } = require("../utils/format");

module.exports = function indomaret(data) {
  const items = data.items || [];
  const itemRows = items
    .map(
      (item) => `
    <tr><td colspan="3" style="padding:2px 0 0; font-weight:bold; font-size: 12px;">${item.name}</td></tr>
    <tr>
      <td style="padding:0 0 2px; font-size: 11.5px;">&nbsp;&nbsp;${item.qty} x ${formatRp(item.price)}</td>
      <td></td>
      <td class="r" style="font-size: 11.5px; font-weight: bold;">${formatRp(item.qty * item.price)}</td>
    </tr>`,
    )
    .join("");

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = data.tax || 0;
  const discount = data.discount || 0;
  const grandTotal = subtotal + tax - discount;
  const payment = data.payment || grandTotal;
  const change = payment - grandTotal;

  return `<!DOCTYPE html>
<html><head><style>
  @page { size: 58mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; }
  body { 
    width: 48mm; 
    margin: 0 auto;
    font-family: 'Courier New', monospace; 
    font-size: 11px; 
    padding: 8mm 3mm 2mm; 
    color: #000; 
    overflow-x: hidden;
  }
  .center { text-align: center; } .r { text-align: right; } .bold { font-weight: bold; }
  .sep { border-top: 1px dashed #000; margin: 4px 0; }
  .sep-double { border-top: 2px double #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td { padding: 1px 0; vertical-align: top; word-break: break-word; }
  .store-name { font-size: 16px; font-weight: 900; }
  .footer { font-size: 11px; margin-top: 10px; }
  .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 40px; letter-spacing: 2px; }
  .total-line { font-size: 16px; font-weight: bold; }
  
  .pixel-trigger {
    width: 2px;
    height: 1px;
    background: #000;
    margin: 0 auto;
    opacity: 0.1;
  }
</style></head><body>
  <div style="height: 5mm; text-align: center;"><div class="pixel-trigger"></div></div>
  
  <div class="center">
    ${data.store_logo ? `<img src="${data.store_logo}" style="max-width:120px; max-height:60px; filter:grayscale(100%); margin-bottom:4px;" />` : ""}
    ${data.store_name ? `<div class="store-name">${data.store_name.toUpperCase()}</div>` : ""}
    <div style="font-size: 11px;">${data.store_address || ""}</div>
    <div style="font-size: 11px;">${data.store_phone ? "Telp: " + data.store_phone : ""}</div>
  </div>
  <div class="sep-double"></div>
  <table>
    <tr><td>No</td><td>: ${data.order_id || "INV-" + Date.now()}</td></tr>
    <tr><td>Tanggal</td><td>: ${data.date || new Date().toLocaleString("id-ID")}</td></tr>
    <tr><td>Kasir</td><td>: ${data.cashier || "ADMIN"}</td></tr>
  </table>
  <div class="sep"></div>
  <table>${itemRows}</table>
  <div class="sep"></div>
  <table>
    <tr><td>Subtotal</td><td class="r">${formatRp(subtotal)}</td></tr>
    ${discount > 0 ? `<tr><td>Diskon</td><td class="r">-${formatRp(discount)}</td></tr>` : ""}
    ${tax > 0 ? `<tr><td>PPN</td><td class="r">${formatRp(tax)}</td></tr>` : ""}
  </table>
  <div class="sep-double"></div>
  <table>
    <tr class="total-line"><td class="bold">TOTAL</td><td class="r bold">${formatRp(grandTotal)}</td></tr>
    <tr><td>${data.payment_method || "TUNAI"}</td><td class="r">${formatRp(payment)}</td></tr>
    <tr class="bold"><td>KEMBALI</td><td class="r">${formatRp(change)}</td></tr>
  </table>
  <div class="sep"></div>
  <div class="center footer">
    <div>${data.footer_message || "Terima kasih!"}</div>
    <div>Barang yang sudah dibeli</div>
    <div>tidak dapat ditukar/dikembalikan</div>
    <div style="margin-top:8px;" class="barcode">*${data.order_id || Date.now()}*</div>
    
    <div style="height: 30mm; position: relative; overflow: hidden; display: block;">
      <div style="position: absolute; bottom: 1px; left: 50%; width: 2px; height: 1px; background: #000; opacity: 0.1;"></div>
    </div>
  </div>
</body></html>`;
};

const { formatRp } = require("../utils/format");

module.exports = function indomaret(data) {
  const items = data.items || [];
  const itemRows = items
    .map(
      (item) => `
    <tr><td colspan="3" style="padding:2px 0 0;">${item.name}</td></tr>
    <tr>
      <td style="padding:0 0 2px;">${item.qty} x ${formatRp(item.price)}</td>
      <td></td>
      <td class="r">${formatRp(item.qty * item.price)}</td>
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
  @page { size: auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 100%; font-family: 'Courier New', monospace; font-size: 13px; padding: 10px; color: #000; overflow: hidden; }
  .center { text-align: center; } .r { text-align: right; } .bold { font-weight: bold; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  .sep-double { border-top: 2px double #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .store-name { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
  .footer { font-size: 11px; margin-top: 10px; }
  .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 40px; letter-spacing: 2px; overflow-wrap: break-word; word-break: break-all; max-width: 100%; }
  .total-line { font-size: 16px; font-weight: bold; }
</style></head><body>
  <div class="center">
    <div class="store-name">${data.store_name || "TOKO SAYA"}</div>
    <div>${data.store_address || ""}</div>
    <div>${data.store_phone || ""}</div>
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
  </div>
</body></html>`;
};

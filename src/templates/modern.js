const { formatRp } = require("../utils/format");

module.exports = function modern(data) {
  const items = data.items || [];
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td class="center">${item.qty}</td>
      <td class="r">${formatRp(item.price)}</td>
      <td class="r bold">${formatRp(item.qty * item.price)}</td>
    </tr>`,
    )
    .join("");

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = data.tax || 0;
  const discount = data.discount || 0;
  const grandTotal = subtotal + tax - discount;

  return `<!DOCTYPE html>
<html><head><style>
  @page { size: 380px auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 380px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; padding: 15px; color: #333; }
  .center { text-align: center; } .r { text-align: right; } .bold { font-weight: bold; }
  .sep { border-top: 1px solid #ddd; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 4px 2px; }
  th { text-align: left; font-size: 11px; color: #888; border-bottom: 2px solid #333; }
  .logo { font-size: 22px; font-weight: 800; color: #1a1a2e; letter-spacing: 1px; }
  .total-box { background: #1a1a2e; color: #fff; padding: 10px; border-radius: 6px; margin: 10px 0; }
  .total-box .amount { font-size: 20px; font-weight: bold; }
  .footer { font-size: 10px; color: #999; margin-top: 15px; }
  .badge { display: inline-block; background: #fff3; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
</style></head><body>
  <div class="center">
    <div class="logo">${data.store_name || "STORE"}</div>
    <div style="color:#888;font-size:11px;">${data.store_address || ""}</div>
  </div>
  <div class="sep"></div>
  <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;">
    <span>#${data.order_id || Date.now()}</span>
    <span>${data.date || new Date().toLocaleString("id-ID")}</span>
  </div>
  <div class="sep"></div>
  <table>
    <thead><tr><th>Item</th><th class="center">Qty</th><th class="r">Harga</th><th class="r">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="sep"></div>
  <table>
    <tr><td>Subtotal</td><td class="r">${formatRp(subtotal)}</td></tr>
    ${discount > 0 ? `<tr><td>Diskon</td><td class="r" style="color:#e53935;">-${formatRp(discount)}</td></tr>` : ""}
    ${tax > 0 ? `<tr><td>PPN</td><td class="r">${formatRp(tax)}</td></tr>` : ""}
  </table>
  <div class="total-box center">
    <div style="font-size:11px;">TOTAL PEMBAYARAN</div>
    <div class="amount">${formatRp(grandTotal)}</div>
    <span class="badge">${data.payment_method || "TUNAI"}</span>
  </div>
  <div class="center footer">${data.footer_message || "Terima kasih!"}</div>
</body></html>`;
};

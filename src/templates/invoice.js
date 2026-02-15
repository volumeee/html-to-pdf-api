const { formatRp } = require("../utils/format");

module.exports = function invoice(data) {
  const items = data.items || [];
  const itemRows = items
    .map(
      (item, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${item.name}</td>
      <td class="center">${item.qty}</td>
      <td class="r">${formatRp(item.price)}</td>
      <td class="r bold">${formatRp(item.qty * item.price)}</td>
    </tr>`,
    )
    .join("");

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = data.tax || Math.round(subtotal * 0.11);
  const discount = data.discount || 0;
  const grandTotal = subtotal + tax - discount;

  return `<!DOCTYPE html>
<html><head><style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #333; padding: 40px; }
  .r { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .company { font-size: 24px; font-weight: 800; color: #1a1a2e; }
  .invoice-title { font-size: 28px; font-weight: 300; color: #667; letter-spacing: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { background: #1a1a2e; color: #fff; padding: 10px 8px; text-align: left; font-size: 12px; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  tr:hover { background: #f9f9f9; }
  .total-section { margin-top: 20px; } .total-section td { border: none; padding: 4px 8px; }
  .grand-total { font-size: 18px; font-weight: bold; color: #1a1a2e; border-top: 2px solid #1a1a2e !important; }
  .notes { margin-top: 40px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1a1a2e; }
  .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; }
</style></head><body>
  <div class="header">
    <div>
      <div class="company">${data.store_name || "PERUSAHAAN"}</div>
      <div style="color:#666;">${data.store_address || ""}</div>
      <div style="color:#666;">${data.store_phone || ""}</div>
    </div>
    <div style="text-align:right;">
      <div class="invoice-title">INVOICE</div>
      <div style="margin-top:10px;">
        <strong>No:</strong> ${data.order_id || "INV-" + Date.now()}<br>
        <strong>Tanggal:</strong> ${data.date || new Date().toLocaleDateString("id-ID")}<br>
        <strong>Jatuh Tempo:</strong> ${data.due_date || "-"}
      </div>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
    <strong>Kepada:</strong><br>
    ${data.customer_name || "Pelanggan"}<br>
    <span style="color:#666;">${data.customer_address || ""}</span><br>
    <span style="color:#666;">${data.customer_phone || ""}</span>
  </div>
  <table>
    <thead><tr><th class="center" style="width:40px;">No</th><th>Deskripsi</th><th class="center" style="width:60px;">Qty</th><th class="r" style="width:120px;">Harga</th><th class="r" style="width:130px;">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table class="total-section" style="width:300px;margin-left:auto;">
    <tr><td>Subtotal</td><td class="r">${formatRp(subtotal)}</td></tr>
    ${discount > 0 ? `<tr><td>Diskon</td><td class="r" style="color:#e53935;">-${formatRp(discount)}</td></tr>` : ""}
    <tr><td>PPN (11%)</td><td class="r">${formatRp(tax)}</td></tr>
    <tr class="grand-total"><td class="bold">TOTAL</td><td class="r">${formatRp(grandTotal)}</td></tr>
  </table>
  ${data.notes ? `<div class="notes"><strong>Catatan:</strong><br>${data.notes}</div>` : ""}
  <div class="footer">${data.footer_message || "Terima kasih atas kepercayaan Anda."}</div>
</body></html>`;
};

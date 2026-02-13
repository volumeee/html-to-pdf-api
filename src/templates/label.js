/**
 * Template: Label Pengiriman (Shipping Label)
 */
module.exports = function label(data) {
  return `<!DOCTYPE html>
<html><head><style>
  @page { size: 100mm 150mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 100mm; height: 150mm; font-family: Arial, sans-serif; font-size: 10px; padding: 8px; color: #000; overflow: hidden; }

  .header { background: #000; color: #fff; padding: 6px 10px; text-align: center; font-size: 14px; font-weight: bold; letter-spacing: 2px; border-radius: 4px 4px 0 0; }
  .section { border: 1px solid #000; padding: 8px; margin-top: -1px; }
  .section-title { font-size: 8px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .name { font-size: 14px; font-weight: bold; }
  .address { font-size: 11px; margin-top: 3px; line-height: 1.4; }
  .phone { font-size: 10px; color: #444; margin-top: 3px; }

  .divider { border-top: 2px dashed #000; margin: 0; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .info-grid .cell { border: 1px solid #000; padding: 6px; margin: -0.5px; }
  .info-grid .label { font-size: 8px; color: #666; text-transform: uppercase; }
  .info-grid .value { font-size: 12px; font-weight: bold; margin-top: 2px; }

  .barcode-area { text-align: center; padding: 8px; border: 1px solid #000; margin-top: -1px; }
  .barcode { font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: 4px; font-weight: bold; }
  .barcode-text { font-size: 10px; color: #666; margin-top: 4px; }

  .notes { font-size: 9px; color: #555; padding: 6px; border: 1px solid #000; margin-top: -1px; border-radius: 0 0 4px 4px; }
</style></head><body>
  <div class="header">${data.kurir || "KURIR EXPRESS"}</div>

  <div class="section">
    <div class="section-title">📦 PENGIRIM</div>
    <div class="name">${data.pengirim_nama || "Nama Pengirim"}</div>
    <div class="address">${data.pengirim_alamat || "Alamat Pengirim"}</div>
    <div class="phone">📞 ${data.pengirim_telp || "-"}</div>
  </div>

  <div class="divider"></div>

  <div class="section" style="background:#f9f9f9;">
    <div class="section-title">📍 PENERIMA</div>
    <div class="name" style="font-size:16px;">${data.penerima_nama || "Nama Penerima"}</div>
    <div class="address" style="font-size:12px;">${data.penerima_alamat || "Alamat Penerima"}</div>
    <div class="phone" style="font-size:11px;">📞 ${data.penerima_telp || "-"}</div>
  </div>

  <div class="info-grid">
    <div class="cell"><div class="label">Berat</div><div class="value">${data.berat || "1"} kg</div></div>
    <div class="cell"><div class="label">Layanan</div><div class="value">${data.layanan || "REG"}</div></div>
    <div class="cell"><div class="label">COD</div><div class="value">${data.cod ? "Rp " + data.cod.toLocaleString("id-ID") : "TIDAK"}</div></div>
    <div class="cell"><div class="label">Koli</div><div class="value">${data.koli || 1} / ${data.total_koli || 1}</div></div>
  </div>

  <div class="barcode-area">
    <div class="barcode">${data.resi || "TRX" + Date.now()}</div>
    <div class="barcode-text">No. Resi / AWB</div>
  </div>

  ${data.catatan ? `<div class="notes">📝 ${data.catatan}</div>` : ""}
</body></html>`;
};

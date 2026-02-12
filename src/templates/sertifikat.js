/**
 * Template: Sertifikat / Piagam (Certificate)
 */
module.exports = function sertifikat(data) {
  return `<!DOCTYPE html>
<html><head><style>
  @page { size: 297mm 210mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 297mm; height: 210mm;
    font-family: 'Georgia', serif;
    background: linear-gradient(135deg, #f5f0e8 0%, #fff 50%, #f0ebe0 100%);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .border-outer {
    position: absolute; top: 12px; left: 12px; right: 12px; bottom: 12px;
    border: 3px solid #b8860b; border-radius: 4px;
  }
  .border-inner {
    position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px;
    border: 1px solid #daa520;
  }

  .corner { position: absolute; width: 60px; height: 60px; }
  .corner svg { fill: #b8860b; width: 100%; height: 100%; }
  .corner-tl { top: 25px; left: 25px; }
  .corner-tr { top: 25px; right: 25px; transform: scaleX(-1); }
  .corner-bl { bottom: 25px; left: 25px; transform: scaleY(-1); }
  .corner-br { bottom: 25px; right: 25px; transform: scale(-1); }

  .content { text-align: center; padding: 40px; z-index: 1; max-width: 80%; }

  .title {
    font-size: 36pt; font-weight: bold; color: #b8860b;
    letter-spacing: 6px; text-transform: uppercase;
    margin-bottom: 5px;
  }
  .subtitle {
    font-size: 14pt; color: #8b7355; letter-spacing: 3px;
    margin-bottom: 25px; font-style: italic;
  }
  .award-line { font-size: 11pt; color: #555; margin-bottom: 8px; }
  .recipient {
    font-size: 28pt; font-weight: bold; color: #1a1a2e;
    border-bottom: 2px solid #b8860b; padding-bottom: 8px;
    margin: 15px auto; display: inline-block;
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  }
  .description { font-size: 11pt; color: #555; margin: 15px 0; line-height: 1.6; max-width: 600px; margin-left: auto; margin-right: auto; }
  .date-place { font-size: 10pt; color: #888; margin-top: 25px; }

  .signatures { display: flex; justify-content: space-around; margin-top: 30px; width: 100%; }
  .sig { text-align: center; min-width: 150px; }
  .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
  .sig-name { font-weight: bold; font-size: 11pt; }
  .sig-title { font-size: 9pt; color: #666; }

  .nomor { position: absolute; bottom: 30px; left: 40px; font-size: 8pt; color: #aaa; }
</style></head><body>
  <div class="border-outer"></div>
  <div class="border-inner"></div>

  <div class="corner corner-tl"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z M12,12 L50,12 L50,16 L16,16 L16,50 L12,50 Z"/></svg></div>
  <div class="corner corner-tr"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z M12,12 L50,12 L50,16 L16,16 L16,50 L12,50 Z"/></svg></div>
  <div class="corner corner-bl"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z M12,12 L50,12 L50,16 L16,16 L16,50 L12,50 Z"/></svg></div>
  <div class="corner corner-br"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z M12,12 L50,12 L50,16 L16,16 L16,50 L12,50 Z"/></svg></div>

  <div class="content">
    <div class="title">${data.judul || "SERTIFIKAT"}</div>
    <div class="subtitle">${data.sub_judul || "Certificate of Achievement"}</div>

    <div class="award-line">${data.keterangan_atas || "Dengan bangga diberikan kepada:"}</div>
    <div class="recipient">${data.nama_penerima || "Nama Penerima"}</div>
    <div class="description">${data.deskripsi || "Atas partisipasi dan dedikasi yang luar biasa."}</div>

    <div class="date-place">${data.tempat || "Jakarta"}, ${data.tanggal || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>

    <div class="signatures">
      ${(data.penandatangan || [{ nama: "Nama", jabatan: "Jabatan" }])
        .map(
          (s) =>
            `<div class="sig"><div class="sig-line"><div class="sig-name">${s.nama}</div><div class="sig-title">${s.jabatan}</div></div></div>`,
        )
        .join("")}
    </div>
  </div>

  <div class="nomor">No: ${data.nomor || "SERT/" + Date.now()}</div>
</body></html>`;
};

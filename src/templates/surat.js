/**
 * Template: Surat Resmi (Official Letter)
 */
module.exports = function surat(data) {
  const tanggal =
    data.tanggal ||
    new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return `<!DOCTYPE html>
<html><head><style>
  @page { size: A4; margin: 25mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #222; line-height: 1.6; padding: 40px; overflow: hidden; }

  .kop { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 20px; }
  .kop .nama { font-size: 18pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
  .kop .sub { font-size: 10pt; color: #555; }
  .kop .alamat { font-size: 9pt; color: #666; }

  .meta { margin-bottom: 25px; }
  .meta table { border-collapse: collapse; }
  .meta td { padding: 2px 8px 2px 0; vertical-align: top; }

  .perihal { margin-bottom: 20px; }
  .isi { text-align: justify; margin-bottom: 30px; }
  .isi p { text-indent: 40px; margin-bottom: 10px; }

  .ttd { margin-top: 40px; text-align: right; padding-right: 40px; }
  .ttd .nama-ttd { margin-top: 70px; font-weight: bold; text-decoration: underline; }
  .ttd .jabatan { font-size: 10pt; color: #555; }

  .tembusan { margin-top: 40px; font-size: 10pt; color: #555; }
</style></head><body>
  <div class="kop">
    <div class="nama">${data.instansi || "NAMA INSTANSI / PERUSAHAAN"}</div>
    <div class="sub">${data.sub_instansi || ""}</div>
    <div class="alamat">${data.alamat_instansi || "Jl. Contoh No. 123, Jakarta"}</div>
    <div class="alamat">${data.kontak_instansi || "Telp: (021) 123-4567 | Email: info@instansi.go.id"}</div>
  </div>

  <div class="meta">
    <table>
      <tr><td>Nomor</td><td>: ${data.nomor_surat || "001/UN/2026"}</td></tr>
      <tr><td>Lampiran</td><td>: ${data.lampiran || "-"}</td></tr>
      <tr><td>Perihal</td><td>: <strong>${data.perihal || "Perihal Surat"}</strong></td></tr>
    </table>
  </div>

  <div style="margin-bottom: 20px;">
    <div>Kepada Yth.</div>
    <div><strong>${data.tujuan_nama || "Nama Penerima"}</strong></div>
    <div>${data.tujuan_alamat || "Alamat Penerima"}</div>
    <div>di Tempat</div>
  </div>

  <div class="isi">
    <p>${data.salam_pembuka || "Dengan hormat,"}</p>
    ${(data.isi || ["Isi surat belum diisi."]).map((p) => `<p>${p}</p>`).join("")}
    <p>${data.salam_penutup || "Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih."}</p>
  </div>

  <div style="text-align:right;margin-bottom:5px;font-size:10pt;">${data.kota || "Jakarta"}, ${tanggal}</div>

  <div class="ttd">
    <div>${data.jabatan_ttd || "Direktur"}</div>
    <div class="nama-ttd">${data.nama_ttd || "Nama Penandatangan"}</div>
    <div class="jabatan">NIP. ${data.nip || "___________________"}</div>
  </div>

  ${data.tembusan ? `<div class="tembusan"><strong>Tembusan:</strong><br>${data.tembusan.map((t) => `- ${t}`).join("<br>")}</div>` : ""}
</body></html>`;
};

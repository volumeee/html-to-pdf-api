/**
 * Template Registry
 * Central place to register and access all templates.
 * Supports built-in and custom templates.
 * v7.0.0: Added sampleData for preview generation.
 */
const {
  getCustomTemplate,
  listCustomTemplates,
} = require("../services/customTemplate");

const templates = {
  indomaret: {
    fn: require("./indomaret"),
    description: "Struk thermal ala Indomaret/Alfamart",
    defaultPageSize: "thermal_default",
    category: "receipt",
    sampleData: {
      store_name: "INDOMARET",
      store_address: "Jl. Sudirman No. 123, Jakarta",
      store_phone: "021-1234567",
      cashier: "Kasir 01",
      date: new Date().toLocaleDateString("id-ID"),
      time: "14:30",
      items: [
        { name: "Indomie Goreng", qty: 3, price: 3500 },
        { name: "Teh Botol Sosro", qty: 2, price: 5000 },
        { name: "Roti Tawar Sari Roti", qty: 1, price: 15000 },
      ],
      payment_method: "TUNAI",
      total_paid: 50000,
    },
  },
  modern: {
    fn: require("./modern"),
    description: "Struk thermal desain modern & minimalis",
    defaultPageSize: "thermal_default",
    category: "receipt",
    sampleData: {
      store_name: "COFFEE SHOP",
      store_address: "Jl. Melawai No. 45, Jakarta Selatan",
      store_phone: "021-7654321",
      cashier: "Barista",
      date: new Date().toLocaleDateString("id-ID"),
      items: [
        { name: "Cappuccino", qty: 2, price: 35000 },
        { name: "Croissant", qty: 1, price: 28000 },
      ],
      payment_method: "QRIS",
    },
  },
  invoice: {
    fn: require("./invoice"),
    description: "Invoice A4 profesional dengan PPN",
    defaultPageSize: "a4",
    category: "document",
    sampleData: {
      invoice_no: "INV-PREVIEW-001",
      company_name: "PT Contoh Perusahaan",
      company_address: "Jl. Sudirman No. 1, Jakarta 10220",
      company_phone: "021-5555555",
      client_name: "PT Pelanggan Setia",
      client_address: "Jl. Thamrin No. 10, Jakarta",
      items: [
        { name: "Jasa Konsultasi IT", qty: 10, price: 500000 },
        { name: "Lisensi Software", qty: 1, price: 2500000 },
        { name: "Training Staff", qty: 2, price: 1500000 },
      ],
      notes: "Pembayaran dalam 30 hari. Transfer ke BCA 1234567890.",
    },
  },
  surat: {
    fn: require("./surat"),
    description: "Surat resmi dengan kop surat & tanda tangan",
    defaultPageSize: "a4",
    category: "document",
    sampleData: {
      nomor_surat: "001/DIR/II/2026",
      tanggal: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      tujuan: "Bapak/Ibu Direktur HRD",
      perusahaan_tujuan: "PT Pelanggan Setia",
      alamat_tujuan: "Jl. Thamrin No. 10, Jakarta",
      perihal: "Penawaran Kerjasama",
      isi_surat:
        "Dengan hormat,\n\nKami dari PT Contoh Perusahaan bermaksud menawarkan kerjasama di bidang teknologi informasi. Kami yakin kerjasama ini akan memberikan manfaat bagi kedua belah pihak.\n\nDemikian surat ini kami sampaikan, atas perhatiannya kami ucapkan terima kasih.",
      nama_pengirim: "Budi Santoso",
      jabatan_pengirim: "Direktur Utama",
      nama_perusahaan: "PT Contoh Perusahaan",
    },
  },
  sertifikat: {
    fn: require("./sertifikat"),
    description: "Sertifikat/piagam landscape dengan border dekoratif",
    defaultPageSize: "sertifikat",
    category: "document",
    sampleData: {
      nama: "Ahmad Fauzi",
      judul: "Workshop Web Development",
      tanggal: "10-12 Februari 2026",
      penyelenggara: "PT Contoh Perusahaan",
      nomor_sertifikat: "CERT/2026/001",
      deskripsi:
        "Telah berpartisipasi aktif dalam kegiatan Workshop Web Development selama 3 hari.",
      nama_ttd: "Dr. Siti Aminah",
      jabatan_ttd: "Direktur Akademik",
    },
  },
  label: {
    fn: require("./label"),
    description: "Label pengiriman paket (100x150mm)",
    defaultPageSize: "label",
    category: "shipping",
    sampleData: {
      pengirim: {
        nama: "Toko Online ABC",
        alamat: "Jl. Sudirman No. 1, Blok A2",
        kota: "Jakarta Pusat",
        telepon: "081234567890",
      },
      penerima: {
        nama: "Budi Santoso",
        alamat: "Jl. Merdeka No. 45, RT 03/RW 05, Kel. Sukajaya",
        kota: "Bandung",
        telepon: "089876543210",
      },
      kurir: "JNE REG",
      resi: "JNE0123456789",
      berat: "1.5 kg",
    },
  },
};

function getTemplate(name) {
  // Check built-in templates first
  if (templates[name]) return templates[name];

  // Fallback to custom templates
  const custom = getCustomTemplate(name);
  if (custom) return custom;

  return null;
}

function listTemplates() {
  const builtIn = Object.entries(templates).map(([name, t]) => ({
    name,
    description: t.description,
    default_page_size: t.defaultPageSize,
    category: t.category,
    type: "built-in",
    has_preview: !!t.sampleData,
  }));

  const custom = listCustomTemplates();

  return [...builtIn, ...custom];
}

module.exports = { getTemplate, listTemplates };

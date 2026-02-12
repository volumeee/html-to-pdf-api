const axios = require("axios");

async function testApi() {
  const html = `
    <html>
        <body style="width: 380px; font-family: 'Courier New';">
            <h1 style="text-align: center;">TEST RECEIPT</h1>
            <p>This is a test PDF generation.</p>
            <table style="width: 100%;">
                <tr><td>Item 1</td><td style="text-align: right;">Rp 10.000</td></tr>
                <tr><td>Item 2</td><td style="text-align: right;">Rp 20.000</td></tr>
            </table>
            <hr>
            <p style="text-align: right;">Total: Rp 30.000</p>
        </body>
    </html>
    `;

  try {
    console.log("Sending request to API...");
    const response = await axios.post("http://localhost:3000/cetak_struk_pdf", {
      html_content: html,
      filename: "test_receipt.pdf",
    });
    console.log("Success!", response.data);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testApi();

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ItemRecibo {
  nombre: string
  cantidad: number
  precio: number
  subtotal: number
}

interface DatosRecibo {
  numeroVenta: string
  fecha: string
  nombreNegocio: string
  items: ItemRecibo[]
  subtotal: number
  descuento: number
  total: number
}

export const generarReciboPDF = async (datos: DatosRecibo) => {
  // Crear contenedor temporal
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '800px'
  container.style.background = 'white'
  container.style.padding = '40px'
  
  container.innerHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Header con gradiente -->
      <div style="background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0; margin: -40px -40px 0 -40px;">
        <div style="display: inline-block; background: white; padding: 12px 30px; border-radius: 8px; margin-bottom: 15px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #18181b;">TuckFlow</h1>
        </div>
        <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Sistema de Gestión Empresarial</p>
      </div>

      <!-- Info del negocio -->
      <div style="padding: 30px 0; border-bottom: 3px solid #e4e4e7;">
        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #18181b;">${datos.nombreNegocio}</h2>
        <p style="margin: 0; color: #71717a; font-size: 14px;">Sistema de Ventas y Facturación</p>
      </div>

      <!-- Detalles de factura -->
      <div style="display: flex; justify-content: space-between; padding: 25px; background: linear-gradient(135deg, #f4f4f5 0%, #fafafa 100%); border-radius: 10px; margin: 25px 0;">
        <div style="flex: 1;">
          <p style="margin: 0 0 5px 0; font-size: 11px; color: #71717a; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Factura No.</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b;">${datos.numeroVenta}</p>
        </div>
        <div style="flex: 1; text-align: right;">
          <p style="margin: 0 0 5px 0; font-size: 11px; color: #71717a; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Fecha de Emisión</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #3f3f46;">${datos.fecha}</p>
        </div>
      </div>

      <!-- Tabla de productos -->
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
        <thead>
          <tr style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%);">
            <th style="padding: 15px; text-align: left; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Producto</th>
            <th style="padding: 15px; text-align: center; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 80px;">Cant.</th>
            <th style="padding: 15px; text-align: right; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Precio Unit.</th>
            <th style="padding: 15px; text-align: right; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 130px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${datos.items.map((item, index) => `
            <tr style="border-bottom: 1px solid #e4e4e7; ${index % 2 === 0 ? 'background: #fafafa;' : 'background: white;'}">
              <td style="padding: 15px; font-size: 14px; font-weight: 500; color: #18181b;">${item.nombre}</td>
              <td style="padding: 15px; text-align: center; font-size: 14px; color: #3f3f46;">${item.cantidad}</td>
              <td style="padding: 15px; text-align: right; font-size: 14px; color: #3f3f46;">$${item.precio.toLocaleString()}</td>
              <td style="padding: 15px; text-align: right; font-size: 15px; font-weight: 600; color: #18181b;">$${item.subtotal.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totales -->
      <div style="margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%); border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; color: #52525b;">
          <span>Subtotal</span>
          <span style="font-weight: 600; color: #18181b;">$${datos.subtotal.toLocaleString()}</span>
        </div>
        ${datos.descuento > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; color: #dc2626;">
            <span style="font-weight: 500;">Descuento</span>
            <span style="font-weight: 600;">-$${datos.descuento.toLocaleString()}</span>
          </div>
        ` : ''}
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #d4d4d8;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 20px; font-weight: 700; color: #18181b;">TOTAL A PAGAR</span>
            <span style="font-size: 28px; font-weight: 800; color: #16a34a;">$${datos.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 0 0 12px 12px; text-align: center; margin-left: -40px; margin-right: -40px; margin-bottom: -40px;">
        <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: white;">¡Gracias por su compra!</p>
        <p style="margin: 0 0 15px 0; font-size: 13px; color: rgba(255,255,255,0.7);">Para cualquier consulta sobre esta factura, contáctenos</p>
        <div style="display: inline-block; background: rgba(255,255,255,0.1); padding: 10px 25px; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: white;">TuckFlow</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.7);">www.tuckflow.com | soporte@tuckflow.com</p>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 10

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    pdf.save(`Factura-${datos.numeroVenta}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

export const imprimirRecibo = (datos: DatosRecibo) => {
  const ventana = window.open('', '', 'width=800,height=900')
  if (!ventana) return

  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Factura ${datos.numeroVenta}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 40px;
          background: #f9fafb;
        }
        
        .invoice {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%);
          padding: 40px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="none"/><circle cx="10" cy="10" r="2" fill="white" opacity="0.1"/></svg>');
          opacity: 0.3;
        }
        
        .header .logo {
          display: inline-block;
          background: white;
          padding: 12px 30px;
          border-radius: 10px;
          margin-bottom: 15px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #18181b;
        }
        
        .header p {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 500;
          position: relative;
        }
        
        .content {
          padding: 40px;
        }
        
        .business-info {
          padding-bottom: 25px;
          border-bottom: 3px solid #e4e4e7;
          margin-bottom: 25px;
        }
        
        .business-info h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #18181b;
        }
        
        .business-info p {
          color: #71717a;
          font-size: 14px;
        }
        
        .invoice-details {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          padding: 25px;
          background: linear-gradient(135deg, #f4f4f5 0%, #fafafa 100%);
          border-radius: 12px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        
        .detail-item {
          flex: 1;
        }
        
        .detail-item .label {
          font-size: 11px;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .detail-item .value {
          font-size: 20px;
          font-weight: 700;
          color: #18181b;
        }
        
        .detail-item:last-child .value {
          font-size: 16px;
          font-weight: 600;
          color: #3f3f46;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        thead {
          background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
        }
        
        th {
          padding: 15px;
          font-weight: 600;
          font-size: 12px;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        th:first-child {
          text-align: left;
        }
        
        th:last-child {
          text-align: right;
        }
        
        tbody tr {
          border-bottom: 1px solid #e4e4e7;
          transition: background 0.2s;
        }
        
        tbody tr:nth-child(even) {
          background: #fafafa;
        }
        
        tbody tr:last-child {
          border-bottom: none;
        }
        
        td {
          padding: 15px;
          font-size: 14px;
          color: #3f3f46;
        }
        
        td:first-child {
          font-weight: 500;
          color: #18181b;
        }
        
        td:nth-child(2),
        td:nth-child(3) {
          text-align: center;
        }
        
        td:last-child {
          text-align: right;
          font-weight: 600;
          font-size: 15px;
          color: #18181b;
        }
        
        .totals {
          padding: 25px;
          background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
          border-radius: 12px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 15px;
          color: #52525b;
        }
        
        .total-row .value {
          font-weight: 600;
          color: #18181b;
        }
        
        .total-row.discount {
          color: #dc2626;
        }
        
        .total-row.discount .value {
          color: #dc2626;
          font-weight: 600;
        }
        
        .total-row.final {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #d4d4d8;
        }
        
        .total-row.final .label {
          font-size: 20px;
          font-weight: 700;
          color: #18181b;
        }
        
        .total-row.final .value {
          font-size: 28px;
          font-weight: 800;
          color: #16a34a;
        }
        
        .footer {
          background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
          padding: 35px;
          text-align: center;
          margin-top: 40px;
          position: relative;
        }
        
        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="2" fill="white" opacity="0.1"/></svg>');
          opacity: 0.3;
        }
        
        .footer-content {
          position: relative;
        }
        
        .footer h3 {
          font-size: 16px;
          margin-bottom: 10px;
          color: white;
          font-weight: 600;
        }
        
        .footer p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin: 5px 0;
        }
        
        .footer .brand {
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 25px;
          border-radius: 8px;
          margin-top: 15px;
          backdrop-filter: blur(10px);
        }
        
        .footer .brand-name {
          font-weight: 600;
          color: white;
          font-size: 14px;
          margin: 0;
        }
        
        .footer .brand-contact {
          margin: 5px 0 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        @media print {
          body {
            padding: 0;
            background: white;
          }
          
          .invoice {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="logo">
            <h1>TuckFlow</h1>
          </div>
          <p>Sistema de Gestión Empresarial</p>
        </div>
        
        <div class="content">
          <div class="business-info">
            <h2>${datos.nombreNegocio}</h2>
            <p>Sistema de Ventas y Facturación</p>
          </div>
          
          <div class="invoice-details">
            <div class="detail-item">
              <div class="label">Factura No.</div>
              <div class="value">${datos.numeroVenta}</div>
            </div>
            <div class="detail-item">
              <div class="label">Fecha de emisión</div>
              <div class="value">${datos.fecha}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Producto</th>
                <th style="text-align: center; width: 80px;">Cant.</th>
                <th style="text-align: center; width: 120px;">Precio Unit.</th>
                <th style="text-align: right; width: 130px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${datos.items.map(item => `
                <tr>
                  <td>${item.nombre}</td>
                  <td style="text-align: center;">${item.cantidad}</td>
                  <td style="text-align: center;">$${item.precio.toLocaleString()}</td>
                  <td style="text-align: right;">$${item.subtotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span class="label">Subtotal</span>
              <span class="value">$${datos.subtotal.toLocaleString()}</span>
            </div>
            ${datos.descuento > 0 ? `
              <div class="total-row discount">
                <span class="label">Descuento</span>
                <span class="value">-$${datos.descuento.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="total-row final">
              <span class="label">TOTAL A PAGAR</span>
              <span class="value">$${datos.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <h3>¡Gracias por su compra!</h3>
            <p>Para cualquier consulta sobre esta factura, contáctenos</p>
            <div class="brand">
              <p class="brand-name">TuckFlow</p>
              <p class="brand-contact">www.tuckflow.com | soporte@tuckflow.com</p>
            </div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => window.print(), 250);
        }
      </script>
    </body>
    </html>
  `)

  ventana.document.close()
}

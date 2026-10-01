import PDFDocument from 'pdfkit';

export async function generateMonthlyPDFReport(data: {
  householdName: string;
  month: string;
  totalExpenses: number;
  totalIncome: number;
  savings: number;
  expenses: Array<{ title: string; category: string; amount: number; date: string }>;
  bills: Array<{ title: string; amount: number; status: string; dueDate: string }>;
  lowStockItems: Array<{ name: string; quantity: number; unit: string }>;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: any) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: any) => reject(err));

    // Header
    doc.fillColor('#0f172a').fontSize(22).text('HomeMind AI - Household Performance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#64748b').fontSize(12).text(`Household: ${data.householdName} | Month: ${data.month}`, { align: 'center' });
    doc.moveDown(1.5);

    // Executive Summary Box
    doc.rect(40, 120, 532, 70).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(12).text(`Total Income: $${data.totalIncome.toFixed(2)}`, 60, 135);
    doc.text(`Total Expenses: $${data.totalExpenses.toFixed(2)}`, 220, 135);
    doc.fillColor(data.savings >= 0 ? '#16a34a' : '#dc2626').text(`Net Savings: $${data.savings.toFixed(2)}`, 400, 135);
    
    doc.moveDown(4);

    // Expenses Breakdown
    doc.fillColor('#0f172a').fontSize(16).text('Recent Household Expenses');
    doc.moveDown(0.5);
    data.expenses.slice(0, 10).forEach((exp) => {
      doc.fontSize(10).fillColor('#334155').text(`${exp.date.split('T')[0]}  |  ${exp.title} (${exp.category}) - $${exp.amount.toFixed(2)}`);
    });

    doc.moveDown(1.5);

    // Bills Summary
    doc.fillColor('#0f172a').fontSize(16).text('Upcoming & Paid Utility Bills');
    doc.moveDown(0.5);
    data.bills.forEach((b) => {
      doc.fontSize(10).fillColor(b.status === 'PAID' ? '#16a34a' : '#ea580c').text(`${b.title}: $${b.amount.toFixed(2)} [${b.status}] - Due: ${b.dueDate.split('T')[0]}`);
    });

    doc.moveDown(1.5);

    // Low Stock Alert
    doc.fillColor('#0f172a').fontSize(16).text('Inventory Low Stock Warning');
    doc.moveDown(0.5);
    data.lowStockItems.forEach((item) => {
      doc.fontSize(10).fillColor('#dc2626').text(`• ${item.name}: ${item.quantity} ${item.unit} remaining`);
    });

    // Footer
    doc.fontSize(9).fillColor('#94a3b8').text(`Generated automatically by HomeMind AI OS on ${new Date().toLocaleDateString()}`, 40, 720, { align: 'center' });

    doc.end();
  });
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (title: string, data: Record<string, unknown>[], columns: string[]) => {
    const doc = new jsPDF();
    doc.text(title, 14, 20);

    const tableData = data.map(row => columns.map(col => {
        const value = row[col];
        return value !== null && value !== undefined ? String(value) : '-';
    }));

    autoTable(doc, {
        head: [columns],
        body: tableData,
        startY: 30,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

export const exportToExcel = (title: string, data: unknown[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
};

export const printPage = () => {
    window.print();
};

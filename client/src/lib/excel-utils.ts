// Utility functions for Excel file processing

export interface ExcelRow {
  [key: string]: any;
}

export function validateExcelData(data: ExcelRow[]): { valid: ExcelRow[]; invalid: { row: number; errors: string[] }[] } {
  const valid: ExcelRow[] = [];
  const invalid: { row: number; errors: string[] }[] = [];

  data.forEach((row, index) => {
    const errors: string[] = [];
    
    // Required fields validation
    if (!row["Hotel Name"] && !row.hotelName) {
      errors.push("Hotel Name is required");
    }
    
    if (!row["Date"] && !row.date) {
      errors.push("Date is required");
    }
    
    const quantity = Number(row["Quantity"] || row.quantity);
    if (!quantity || quantity <= 0) {
      errors.push("Valid quantity is required");
    }
    
    const ratePerKg = Number(row["Rate Per Kg"] || row.ratePerKg || row["Rate"]);
    if (!ratePerKg || ratePerKg <= 0) {
      errors.push("Valid rate per kg is required");
    }
    
    const totalAmount = Number(row["Total Amount"] || row.totalAmount || row["Amount"]);
    if (!totalAmount || totalAmount <= 0) {
      errors.push("Valid total amount is required");
    }

    // Date validation
    if (row["Date"] || row.date) {
      const date = new Date(row["Date"] || row.date);
      if (isNaN(date.getTime())) {
        errors.push("Invalid date format");
      }
    }

    if (errors.length > 0) {
      invalid.push({ row: index + 1, errors });
    } else {
      valid.push(row);
    }
  });

  return { valid, invalid };
}

export function formatExcelDataForImport(data: ExcelRow[]): any[] {
  return data.map(row => ({
    hotelName: row["Hotel Name"] || row.hotelName,
    date: row["Date"] || row.date,
    quantity: Number(row["Quantity"] || row.quantity),
    ratePerKg: Number(row["Rate Per Kg"] || row.ratePerKg || row["Rate"]),
    totalAmount: Number(row["Total Amount"] || row.totalAmount || row["Amount"]),
    paymentStatus: row["Payment Status"] || row.paymentStatus,
    paymentDate: row["Payment Date"] || row.paymentDate,
    paymentAmount: row["Payment Amount"] ? Number(row["Payment Amount"]) : undefined,
    notes: row["Notes"] || row.notes,
  }));
}

export function generateSampleExcelData(): ExcelRow[] {
  return [
    {
      "Hotel Name": "Grand Plaza Hotel",
      "Date": "2024-11-15",
      "Quantity": 5.5,
      "Rate Per Kg": 4.0,
      "Total Amount": 22,
      "Payment Status": "Paid",
      "Payment Date": "2024-11-16",
      "Payment Amount": 22,
      "Notes": "Regular delivery"
    },
    {
      "Hotel Name": "Ocean View Resort",
      "Date": "2024-11-14",
      "Quantity": 8.2,
      "Rate Per Kg": 4.0,
      "Total Amount": 32.8,
      "Payment Status": "Pending",
      "Payment Date": "",
      "Payment Amount": "",
      "Notes": "Bulk order"
    }
  ];
}

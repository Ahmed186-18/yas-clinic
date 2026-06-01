/**
 * Clean Utility to export any React table data into an Excel-compatible Arabic-supported CSV file.
 * Automatically injects the UTF-8 BOM indicator (\uFEFF) so Excel opens Arabic correctly.
 */
export function exportToExcel(data: any[][], headers: string[], fileName: string) {
  const bom = "\uFEFF";
  
  // Format cells: escape double quotes and wrap in quotes to preserve formatting and commas
  const rows = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...data.map(row => 
      row.map(val => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    )
  ];
  
  const csvContent = bom + rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  // Generate download
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

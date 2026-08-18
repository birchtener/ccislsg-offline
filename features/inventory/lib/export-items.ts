import { format } from "date-fns";

export interface InventoryExportItem {
  id: string;
  name: string;
  description?: string | null;
  type?: string;
  item_code?: string | null;
  serial_number?: string | null;
  source_of_fund?: string | null;
  quantity: number;
  unit?: string;
  category_id?: string;
  created_at: string | Date;
  date_purchased?: string | Date | null;
  is_disposed?: boolean;
  category?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  assets?: Array<{
    id?: string;
    asset_tag: string;
    serial_number?: string | null;
    condition?: string | null;
    status?: string;
  }>;
}

export const INVENTORY_CSV_HEADERS = [
  "Item Code",
  "Item",
  "Item Description",
  "Item Serial No.",
  "Quantity",
  "Unit",
  "Source of Fund",
  "Inventory Date",
  "Date Purchased",
  "Condition",
];

/**
 * Resolves the condition string for an inventory item based on its assets.
 */
export function resolveItemCondition(item: InventoryExportItem): string {
  if (item.assets && item.assets.length > 0) {
    const activeAssets = item.assets.filter((a) => a.status !== "DISPOSED");
    const targetAssets = activeAssets.length > 0 ? activeAssets : item.assets;
    const conditions = Array.from(
      new Set(targetAssets.map((a) => a.condition?.trim()).filter(Boolean))
    );
    if (conditions.length > 0) {
      return conditions.join(", ");
    }
  }
  return "Used - Good";
}

/**
 * Formats a single inventory item into CSV row values corresponding to the exact requested columns.
 */
export function formatInventoryItemToCsvRow(item: InventoryExportItem): string[] {
  const itemCode = item.item_code || item.assets?.[0]?.asset_tag || "";
  const itemName = item.name || "";
  const itemDescription = item.description || "";
  const itemSerialNo = item.serial_number || item.assets?.[0]?.serial_number || "";
  const quantity = String(item.quantity ?? 0);
  const unit = item.unit || "pcs";
  const sourceOfFund = item.source_of_fund || "";
  const inventoryDate = item.created_at
    ? format(new Date(item.created_at), "yyyy-MM-dd")
    : "";
  const datePurchased = item.date_purchased
    ? format(new Date(item.date_purchased), "yyyy-MM-dd")
    : "";
  const condition = resolveItemCondition(item);

  return [
    itemCode,
    itemName,
    itemDescription,
    itemSerialNo,
    quantity,
    unit,
    sourceOfFund,
    inventoryDate,
    datePurchased,
    condition,
  ];
}

/**
 * Escapes CSV values and builds a full CSV content string with UTF-8 BOM.
 */
export function buildCsvContent(headers: string[], rows: string[][]): string {
  const escapeCell = (val: string | null | undefined): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCell).join(","));

  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

/**
 * Triggers a browser download of the CSV content.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize a string for use in filenames
 */
export function sanitizeFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Exports items for a single category to a CSV file.
 */
export function exportCategoryItemsToCsv(
  categoryName: string,
  items: InventoryExportItem[]
): void {
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const filename = `inventory_${sanitizeFilename(categoryName || "items")}_${dateStr}.csv`;
  const rows = items.map(formatInventoryItemToCsvRow);
  const csvContent = buildCsvContent(INVENTORY_CSV_HEADERS, rows);
  downloadCsv(csvContent, filename);
}

/**
 * Exports all inventory items (across all categories) to a single CSV file.
 */
export function exportAllItemsToCsv(
  items: InventoryExportItem[],
  customFilename?: string
): void {
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const filename =
    customFilename || `inventory_items_all_categories_${dateStr}.csv`;
  const rows = items.map(formatInventoryItemToCsvRow);
  const csvContent = buildCsvContent(INVENTORY_CSV_HEADERS, rows);
  downloadCsv(csvContent, filename);
}

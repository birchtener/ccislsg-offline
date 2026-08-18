import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("-----------------------------------------");
  console.log("Starting Clean Inventory Reset...");
  console.log("-----------------------------------------");

  // 1. Delete all borrow records
  const borrowsCount = await prisma.inventoryBorrow.deleteMany({});
  console.log(`[1/4] Deleted ${borrowsCount.count} inventory borrow records.`);

  // 2. Delete all stock logs
  const logsCount = await prisma.inventoryStockLog.deleteMany({});
  console.log(`[2/4] Deleted ${logsCount.count} inventory stock logs.`);

  // 3. Delete all physical assets (QR codes)
  const assetsCount = await prisma.inventoryAsset.deleteMany({});
  console.log(`[3/4] Deleted ${assetsCount.count} inventory asset instances.`);

  // 4. Delete all inventory catalog items
  const itemsCount = await prisma.inventoryItem.deleteMany({});
  console.log(`[4/4] Deleted ${itemsCount.count} inventory items.`);

  // 5. Ensure Default System Categories exist cleanly
  console.log("[5/5] Initializing clean default categories...");

  const defaultCategories = [
    { name: "Default", description: "Default system category for general and unassigned items" },
    { name: "Office", description: "General office supplies, stationery, folders, and documentation accessories" },
    { name: "Medicine & Health", description: "First aid kits, emergency medication, and clinic supplies" },
    { name: "Cleaning & Sanitation", description: "Janitorial supplies, disinfectants, and hygiene products" },
    { name: "IT & Computing", description: "Computers, network switches, cables, and hardware components" },
    { name: "Audio & Visual", description: "Microphones, speakers, projectors, and multimedia gear" },
    { name: "Sports & Recreation", description: "Balls, nets, sports kits, and recreational gear" },
    { name: "Laboratory", description: "Lab testing tools, experimental kits, and measuring devices" },
    { name: "Furniture & Fixtures", description: "Chairs, tables, cabinets, and boards" },
    { name: "Appliances", description: "Air conditioners, fans, and electrical appliances" },
    { name: "Events & Logistics", description: "Banners, event equipment, decorations, and props" },
  ];

  for (const cat of defaultCategories) {
    await prisma.inventoryCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { name: cat.name, description: cat.description },
    });
  }

  const finalItemCount = await prisma.inventoryItem.count();
  const finalAssetCount = await prisma.inventoryAsset.count();
  const finalCategoryCount = await prisma.inventoryCategory.count();

  console.log("-----------------------------------------");
  console.log("Inventory Reset Complete!");
  console.log(`Total Active Items: ${finalItemCount}`);
  console.log(`Total Physical Assets: ${finalAssetCount}`);
  console.log(`Total System Categories: ${finalCategoryCount}`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error executing inventory reset:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

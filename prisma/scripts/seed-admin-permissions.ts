import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
});

export const ALL_SYSTEM_PERMISSIONS = [
  // Authentication & Users
  { name: "users:create", category: "Authentication & Users", description: "Create new user accounts" },
  { name: "users:read", category: "Authentication & Users", description: "View user accounts and details" },
  { name: "users:update", category: "Authentication & Users", description: "Edit user profile and account details" },
  { name: "users:delete", category: "Authentication & Users", description: "Delete user accounts" },
  { name: "roles:manage", category: "Authentication & Users", description: "Create, modify, and assign system roles" },

  // Inventory Management
  { name: "inventory:create", category: "Inventory", description: "Create inventory items and categories" },
  { name: "inventory:read", category: "Inventory", description: "View inventory catalog and stock counts" },
  { name: "inventory:update", category: "Inventory", description: "Update item properties and adjust stock" },
  { name: "inventory:delete", category: "Inventory", description: "Delete inventory items" },

  // Lost & Found
  { name: "lost-found:create", category: "Inventory", description: "Log newly reported lost and found items" },
  { name: "lost-found:read", category: "Inventory", description: "View lost and found items" },
  { name: "lost-found:update", category: "Inventory", description: "Update status and claimant info" },
  { name: "lost-found:delete", category: "Inventory", description: "Delete lost and found entries" },

  // Borrowing Desk
  { name: "borrow:create", category: "Borrowing Desk", description: "Issue and process new item borrowings" },
  { name: "borrow:read", category: "Borrowing Desk", description: "View borrow records and borrower history" },
  { name: "borrow:update", category: "Borrowing Desk", description: "Process item returns and condition updates" },
  { name: "borrow:delete", category: "Borrowing Desk", description: "Remove borrow log entries" },

  // Content Management (CMS)
  { name: "post:create", category: "Content Management", description: "Create announcements, events, and projects" },
  { name: "post:read", category: "Content Management", description: "View all published and draft CMS content" },
  { name: "post:update", category: "Content Management", description: "Edit posts and bulletin board highlights" },
  { name: "post:delete", category: "Content Management", description: "Delete posts and announcements" },

  // Audit Logs
  { name: "auditlog:read", category: "Audit Trail", description: "View system-wide security and audit logs" },

  // Fiscal Operations & Payments
  { name: "payment:collect", category: "Fiscal Operations", description: "Collect student fees and process transactions" },
  { name: "payment:read", category: "Fiscal Operations", description: "View payment records and financial analytics" },
  { name: "payment:void", category: "Fiscal Operations", description: "Void or refund transaction records" },
  { name: "item:read", category: "Fiscal Operations", description: "View collectible fee items and merchandise" },
  { name: "item:create", category: "Fiscal Operations", description: "Create new collectible fee items and merchandise" },
  { name: "item:update", category: "Fiscal Operations", description: "Update fee item prices and stock" },
  { name: "item:delete", category: "Fiscal Operations", description: "Delete fee items" },

  // Student Services & Master List
  { name: "students:read", category: "Student Services", description: "View student master lists and profiles" },
  { name: "students:create", category: "Student Services", description: "Add new student records" },
  { name: "students:update", category: "Student Services", description: "Update student details and academic info" },
  { name: "students:delete", category: "Student Services", description: "Delete student records" },

  // Attendance Operations
  { name: "attendance:scan", category: "Student Services", description: "Scan QR codes for live event check-in" },
  { name: "attendance:manage", category: "Student Services", description: "Create and manage attendance events and sessions" },
  { name: "attendance:import", category: "Student Services", description: "Bulk import attendance records" },

  // Clearance Operations
  { name: "clearance:create", category: "Student Services", description: "Issue clearance holds and deficiency records" },
  { name: "clearance:read", category: "Student Services", description: "View clearance lists and student statuses" },
  { name: "clearance:update", category: "Student Services", description: "Sign off and clear student deficiencies" },
  { name: "clearance:delete", category: "Student Services", description: "Remove clearance records" },

  // Feedback
  { name: "feedback:view", category: "Student Services", description: "View student feedback submissions" },
];

export async function SeedAdminPermissions(client = prisma) {
  console.log("==========================================");
  console.log("Seeding ALL Permissions to Admin Role...");
  console.log("==========================================");

  // 1. Ensure Admin Role exists
  let adminRole = await client.role.findUnique({
    where: { name: "Admin" },
  });

  if (!adminRole) {
    console.log("[1/4] 'Admin' role not found. Creating 'Admin' role...");
    adminRole = await client.role.create({
      data: { name: "Admin" },
    });
  } else {
    console.log(`[1/4] Found 'Admin' role (ID: ${adminRole.id})`);
  }

  // 2. Ensure all Permission Categories exist
  const categories = [
    { name: "Authentication & Users", description: "User accounts management and admin control options" },
    { name: "Inventory", description: "Property management and physical stock controls" },
    { name: "Borrowing Desk", description: "Logistics tracking for borrows, returns, and item custody logs" },
    { name: "Content Management", description: "Public platform updates, announcements, events and plans" },
    { name: "Audit Trail", description: "System security history monitoring" },
    { name: "Fiscal Operations", description: "Collectibles, merchandising management, and transaction handling" },
    { name: "Student Services", description: "Student records and services, clearances tracking" },
  ];

  for (const cat of categories) {
    await client.permissionCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { name: cat.name, description: cat.description },
    });
  }
  console.log("[2/4] Permission categories verified/upserted.");

  const dbCategories = await client.permissionCategory.findMany();
  const categoryMap = new Map(dbCategories.map((c) => [c.name, c.id]));

  // 3. Ensure all Permissions exist in DB
  for (const perm of ALL_SYSTEM_PERMISSIONS) {
    const categoryId = categoryMap.get(perm.category);
    if (!categoryId) {
      throw new Error(`Category ${perm.category} not found for permission ${perm.name}`);
    }

    await client.permission.upsert({
      where: { name: perm.name },
      update: { category_id: categoryId },
      create: {
        name: perm.name,
        category_id: categoryId,
      },
    });
  }
  console.log(`[3/4] Verified ${ALL_SYSTEM_PERMISSIONS.length} system permissions.`);

  // 4. Fetch all permissions and map them to the Admin role
  const allDbPermissions = await client.permission.findMany();

  // Clear existing role permissions for Admin and insert all
  await client.rolePermission.deleteMany({
    where: { role_id: adminRole.id },
  });

  const createdRolePermissions = await client.rolePermission.createMany({
    data: allDbPermissions.map((perm) => ({
      role_id: adminRole.id,
      permission_id: perm.id,
    })),
    skipDuplicates: true,
  });

  console.log(
    `[4/4] Successfully assigned ${createdRolePermissions.count} permissions to the 'Admin' role!`
  );

  return {
    role: adminRole,
    permissionsCount: createdRolePermissions.count,
  };
}

async function main() {
  try {
    const result = await SeedAdminPermissions(prisma);
    console.log("==========================================");
    console.log(`Done! Admin role now has full access to all ${result.permissionsCount} permissions.`);
    console.log("==========================================");
  } catch (err) {
    console.error("Error seeding admin permissions:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

if (process.argv[1]?.includes("seed-admin-permissions")) {
  main();
}

import {
  PrismaClient,
  Prisma,
  PostType,
  ProjectStatus,
  GridType,
  CategoryType,
} from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { auth } from "@/features/auth/lib/auth";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
});

const ResetDatabase = async () => {
  console.log("[1] Deleting All Database Data");

  await prisma.$transaction([
    prisma.rolePermission.deleteMany(),
    prisma.postImage.deleteMany(),
    prisma.feeItemStockLog.deleteMany(),
    prisma.feeItemVariant.deleteMany(),
    prisma.transactionItem.deleteMany(),

    prisma.auditLog.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.inventoryBorrow.deleteMany(),
    prisma.inventoryAsset.deleteMany(),

    prisma.post.deleteMany(),
    prisma.inventoryBorrowers.deleteMany(),
    prisma.feeItem.deleteMany(),

    prisma.inventoryItem.deleteMany(),
    prisma.user.deleteMany(),

    prisma.inventoryCategory.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.permissionCategory.deleteMany(),
    prisma.role.deleteMany(),
  ]);

  console.log("[2] Database Reset Complete");
};

const SeedRolesData: Prisma.RoleCreateInput[] = [
  { name: "Admin" },
  { name: "Fiscal" },
  { name: "Program Representative" },
  { name: "Secretary" },
  { name: "Property Custodian" },
  { name: "Vision Committee" },
  { name: "Officer" },
];

const SeedRoles = async () => {
  console.log("[3] Seeding Roles");

  await prisma.role.createMany({
    data: SeedRolesData,
  });

  console.log("[4] Roles Seeded");
};

const SeedPermissionCategoriesAndPermissions = async () => {
  console.log("[5] Seeding Permission Categories");

  const categoriesData = [
    {
      name: "Authentication & Users",
      description: "User accounts management and admin control options",
    },
    {
      name: "Inventory",
      description: "Property management and physical stock controls",
    },
    {
      name: "Borrowing Desk",
      description:
        "Logistics tracking for borrows, returns, and item custody logs",
    },
    {
      name: "Content Management",
      description: "Public platform updates, announcements, events and plans",
    },
    { name: "Audit Trail", description: "System security history monitoring" },
    {
      name: "Fiscal Operations",
      description:
        "Collectibles, merchandising management, and transaction handling",
    },
    {
      name: "Student Services",
      description: "Student records and services, clearances tracking",
    },
  ];

  await prisma.permissionCategory.createMany({
    data: categoriesData,
  });

  const dbCategories = await prisma.permissionCategory.findMany();

  const getCategoryId = (name: string): string => {
    const target = dbCategories.find((cat) => cat.name === name);
    if (!target)
      throw new Error(
        `Category mapping error: Target missing definition for '${name}'`,
      );
    return target.id;
  };

  console.log("[6] Mapping and Seeding Granular System Permissions");

  const permissionsData = [
    // Authentication & User Admin Permissions
    {
      name: "users:create",
      category_id: getCategoryId("Authentication & Users"),
    },
    {
      name: "users:read",
      category_id: getCategoryId("Authentication & Users"),
    },
    {
      name: "users:update",
      category_id: getCategoryId("Authentication & Users"),
    },
    {
      name: "users:delete",
      category_id: getCategoryId("Authentication & Users"),
    },
    {
      name: "roles:manage",
      category_id: getCategoryId("Authentication & Users"),
    },

    // Inventory management Permissions
    { name: "inventory:create", category_id: getCategoryId("Inventory") },
    { name: "inventory:read", category_id: getCategoryId("Inventory") },
    { name: "inventory:update", category_id: getCategoryId("Inventory") },
    { name: "inventory:delete", category_id: getCategoryId("Inventory") },

    { name: "lost-found:create", category_id: getCategoryId("Inventory") },
    { name: "lost-found:read", category_id: getCategoryId("Inventory") },
    { name: "lost-found:update", category_id: getCategoryId("Inventory") },
    { name: "lost-found:delete", category_id: getCategoryId("Inventory") },

    // Borrowing Management Permissions
    { name: "borrow:create", category_id: getCategoryId("Borrowing Desk") },
    { name: "borrow:read", category_id: getCategoryId("Borrowing Desk") },
    { name: "borrow:update", category_id: getCategoryId("Borrowing Desk") },
    { name: "borrow:delete", category_id: getCategoryId("Borrowing Desk") },

    // Content Management Permissions
    { name: "post:create", category_id: getCategoryId("Content Management") },
    { name: "post:read", category_id: getCategoryId("Content Management") },
    { name: "post:update", category_id: getCategoryId("Content Management") },
    { name: "post:delete", category_id: getCategoryId("Content Management") },

    // Audit Log Permissions
    { name: "auditlog:read", category_id: getCategoryId("Audit Trail") },

    // Payment & Fiscal Operations Permissions
    {
      name: "payment:collect",
      category_id: getCategoryId("Fiscal Operations"),
    },
    { name: "payment:read", category_id: getCategoryId("Fiscal Operations") },
    { name: "payment:void", category_id: getCategoryId("Fiscal Operations") },
    { name: "item:read", category_id: getCategoryId("Fiscal Operations") },
    { name: "item:create", category_id: getCategoryId("Fiscal Operations") },
    { name: "item:update", category_id: getCategoryId("Fiscal Operations") },
    { name: "item:delete", category_id: getCategoryId("Fiscal Operations") },

    // Student Master List Permissions
    { name: "students:read", category_id: getCategoryId("Student Services") },
    { name: "students:create", category_id: getCategoryId("Student Services") },
    { name: "students:update", category_id: getCategoryId("Student Services") },
    { name: "students:delete", category_id: getCategoryId("Student Services") },

    // Attendance Tracking Permissions
    { name: "attendance:scan", category_id: getCategoryId("Student Services") },
    {
      name: "attendance:manage",
      category_id: getCategoryId("Student Services"),
    },
    {
      name: "attendance:import",
      category_id: getCategoryId("Student Services"),
    },

    // Clearance Operations Permissions
    {
      name: "clearance:create",
      category_id: getCategoryId("Student Services"),
    },
    { name: "clearance:read", category_id: getCategoryId("Student Services") },
    {
      name: "clearance:update",
      category_id: getCategoryId("Student Services"),
    },
    {
      name: "clearance:delete",
      category_id: getCategoryId("Student Services"),
    },
    {
      name: "feedback:view",
      category_id: getCategoryId("Student Services"),
    },
  ];

  await prisma.permission.createMany({
    data: permissionsData,
  });

  const adminRole = await prisma.role.findUnique({
    where: { name: "Admin" },
  });

  if (adminRole) {
    const allPermissions = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
      data: allPermissions.map((perm) => ({
        role_id: adminRole.id,
        permission_id: perm.id,
      })),
      skipDuplicates: true,
    });
    console.log(
      `[7.1] Assigned ${allPermissions.length} Permissions to Admin Role`,
    );
  }

  console.log("[7] Permissions Seed Complete");
};

const SeedUsersData: {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  role_key: string;
}[] = [
  {
    first_name: "Admin",
    last_name: "Account",
    username: "admin",
    password: "password123",
    role_key: "Admin",
  },
  {
    first_name: "Le Andrea",
    last_name: "Jurado",
    username: "le.jurado",
    password: "le.jurado",
    role_key: "Admin",
  },
  {
    first_name: "Daisy",
    last_name: "Lucenas",
    username: "daisy.lucenas",
    password: "daisy.lucenas",
    role_key: "Admin",
  },
  {
    first_name: "Hannah Bianca",
    last_name: "Abuso",
    username: "hannah.abuso",
    password: "hannah.abuso",
    role_key: "Admin",
  },
  {
    first_name: "Hazel Mae",
    last_name: "Bujawe",
    username: "hazel.bujawe",
    password: "hazel.bujawe",
    role_key: "Admin",
  },
  {
    first_name: "Jan Franscine",
    last_name: "Herbolingo",
    username: "jan.franscine",
    password: "jan.franscine",
    role_key: "Admin",
  },
  {
    first_name: "Joaquin David",
    last_name: "Batallones",
    username: "qin.david",
    password: "qin.david",
    role_key: "Admin",
  },
];

const SeedUsers = async () => {
  console.log("[8] Seeding Users");
  let idx = 1;
  for (const user of SeedUsersData) {
    try {
      const role = await prisma.role.findUnique({
        where: {
          name: user.role_key,
        },
      });

      if (!role) {
        throw new Error(`Role ${user.role_key} not found`);
      }

      const result = await auth.api.signUpEmail({
        body: {
          name: `${user.first_name} ${user.last_name}`,
          first_name: user.first_name,
          last_name: user.last_name,
          email: `${user.username}@ccislsg.com`,
          password: user.password,
          username: user.username,
          role_id: role.id,
        } as any,
        asResponse: false,
      });

      if (result && result.user) {
        console.log(
          `[9.${idx}] Created User: ${user.first_name} ${user.last_name} with Role: ${user.role_key}`,
        );
        idx += 1;
      }
    } catch (error) {
      console.error(`Failed to create user ${user.username}:`, error);
    }
  }

  console.log("[10] Users Seed Complete");
};

type PostImagesInput = {
  image_url: string;
  is_primary?: boolean;
  order?: number;
};

export type SeedPostInput = {
  title: string;
  slug: string;
  content: string;
  type: PostType;
  published: boolean;
  grid_type: GridType;
  created_by_username: string;
  event_date?: Date;
  project_status?: ProjectStatus;
  post_images?: PostImagesInput[];
};

export const SeedPostsData: SeedPostInput[] = [
  {
    title: "Appointment for Blocked Clearance",
    slug: "appointment-for-blocked-clearance",
    type: PostType.announcement,
    published: true,
    grid_type: GridType.AUTO,
    created_by_username: "admin",
    content: `𝑻𝑬 𝑼𝑵𝑺𝑨𝒀 𝑩𝑼𝑯𝑨𝑻𝑶𝑵 𝑷𝑨𝑹𝑨 𝑴𝑨 𝑼𝑵𝑩𝑳𝑶𝑪𝑲?
𝑻𝑬 𝑲𝑨𝑵𝑼𝑺-𝑨 𝑷𝑾𝑬𝑫𝑬 𝑴𝑨𝑲𝑨𝑷𝑨 𝑼𝑵𝑩𝑳𝑶𝑪𝑲?

𝐻𝑒𝑎𝑑𝑠 𝑈𝑝 ℎ𝑒𝑟𝑒, 𝑓𝑒𝑙𝑙𝑜𝑤 𝐶𝑜𝑙𝑙𝑒𝑔𝑒 𝑜𝑓 𝐶𝑜𝑚𝑝𝑢𝑡𝑖𝑛𝑔 𝑎𝑛𝑑 𝐼𝑛𝑓𝑜𝑟𝑚𝑎𝑡𝑖𝑜𝑛 𝑆𝑐𝑖𝑒𝑛𝑐𝑒𝑠 𝑠𝑡𝑢𝑑𝑒𝑛𝑡𝑠! 

To all individuals with clearance blocks remaining from last year's events, you may now schedule an appointment to resolve your status.

* **Form Here:** [https://forms.gle/gvkTwsCnaxFq3cth7](https://forms.gle/gvkTwsCnaxFq3cth7)
* **New Office Location:** Masawa Hall Room 104, behind Hiraya Building

Set your appointment now and wait for further announcement! 

**LEAD WITH INTEGRITY,**
**SUCCEED THROUGH UNITY!**`,
    post_images: [
      {
        image_url:
          "https://res.cloudinary.com/your-cloud/image/upload/v12345/clearance_announcement.jpg",
        is_primary: true,
      },
    ],
  },
  {
    title: "Final Call: Application for Appointed Officers (AY 2026-2027)",
    slug: "final-call-appointed-officers-2026-2027",
    type: PostType.announcement,
    published: true,
    grid_type: GridType.GRID_2X2,
    created_by_username: "admin",
    content: ` 𝑨𝒕𝒕𝒆𝒏𝒕𝒊𝒐𝒏 𝑪𝑪𝑰𝑺 𝒔𝒕𝒖𝒅𝒆𝒏𝒕𝒔! 𝑻𝒉𝒆 𝒂𝒑𝒑𝒍𝒊𝒄𝒂𝒕𝒊𝒐𝒏 𝒑𝒐𝒓𝒕𝒂𝒍 𝒇𝒐𝒓 𝑨𝒑𝒑𝒐𝒊𝒏𝒕𝒆𝒅 𝑶𝒇𝒇𝒊𝒄𝒆𝒓𝒔 (𝑨𝒅𝒎𝒊𝒏 2026-2027) 𝒊𝒔 𝒂𝒃𝒐𝒖𝒕 𝒕𝒐 𝒕𝒊𝒎𝒆 𝒐𝒖𝒕, 𝒂𝒏𝒅 𝒕𝒉𝒊𝒔 𝒊𝒔 𝒚𝒐𝒖𝒓 𝒂𝒃𝒔𝒐𝒍𝒖𝒕𝒆 𝒇𝒊𝒏𝒂𝒍 𝒘𝒂𝒓𝒏𝒊𝒏𝒈 𝒃𝒆𝒇𝒐𝒓𝒆 𝒘𝒆 𝒑𝒖𝒍𝒍 𝒕𝒉𝒆 𝒑𝒍𝒖𝒈. 

We know what you’re thinking: “Am I ready? Is it too much work? What if I just stay behind the scenes?”

𝑇𝑟𝑢𝑒 𝑙𝑒𝑎𝑑𝑒𝑟𝑠ℎ𝑖𝑝 𝑖𝑠𝑛'𝑡 𝑎𝑏𝑜𝑢𝑡 ℎ𝑎𝑣𝑖𝑛𝑔 𝑒𝑣𝑒𝑟𝑦𝑡ℎ𝑖𝑛𝑔 𝑓𝑖𝑔𝑢𝑟𝑒𝑑 𝑜𝑢𝑡; 𝑖𝑡’𝑠 𝑎𝑏𝑜𝑢𝑡 ℎ𝑎𝑣𝑖𝑛𝑔 𝑡ℎ𝑒 ℎ𝑒𝑎𝑟𝑡 𝑡𝑜 𝑠𝑒𝑟𝑣𝑒 𝑎𝑛𝑑 𝑡ℎ𝑒 𝑑𝑟𝑖𝑣𝑒 𝑡𝑜 𝑚𝑎𝑘𝑒 𝑎 𝑑𝑖𝑓𝑓𝑒𝑟𝑒𝑛𝑐𝑒. 𝑌𝑜𝑢’𝑣𝑒 𝑠𝑝𝑒𝑛𝑡 𝑠𝑒𝑚𝑒𝑠𝑡𝑒𝑟𝑠 𝑐𝑜𝑑𝑖𝑛𝑔, 𝑑𝑒𝑠𝑖𝑔𝑛𝑖𝑛𝑔, 𝑎𝑛𝑎𝑙𝑦𝑧𝑖𝑛𝑔, 𝑎𝑛𝑑 𝑏𝑢𝑖𝑙𝑑𝑖𝑛𝑔—𝑛𝑜𝑤 𝑖𝑡’𝑠 𝑡𝑖𝑚𝑒 𝑡𝑜 𝑏𝑢𝑖𝑙𝑑 𝑠𝑜𝑚𝑒𝑡ℎ𝑖𝑛𝑔 𝑏𝑖𝑔𝑔𝑒𝑟. 𝐼𝑡’𝑠 𝑡𝑖𝑚𝑒 𝑡𝑜 𝑏𝑢𝑖𝑙𝑑 𝑎 𝑏𝑒𝑡𝑡𝑒𝑟 𝑠𝑡𝑢𝑑𝑒𝑛𝑡 𝑒𝑥𝑝𝑒𝑟𝑖𝑒𝑛𝑐𝑒 𝑓𝑜𝑟 𝑦𝑜𝑢𝑟 𝑓𝑒𝑙𝑙𝑜𝑤 𝑝𝑒𝑒𝑟𝑠.

Your potential means nothing if you don't do anything with it.

𝑳𝑬𝑨𝑫 𝑾𝑰𝑻𝑯 𝑰𝑵𝑻𝑬𝑮𝑹𝑰𝑻𝒀,
𝑺𝑼𝑪𝑪𝑬𝑬𝑫 𝑻𝑯𝑹𝑶𝑼𝑮𝑯 𝑼𝑵𝑰𝑻𝒀!`,
    post_images: [
      {
        image_url:
          "https://res.cloudinary.com/ygmmi186/image/upload/v1784755737/lsg_1_b9o0ke.jpg",
        is_primary: true,
        order: 0,
      },
      {
        image_url:
          "https://res.cloudinary.com/ygmmi186/image/upload/v1784755737/lsg_2_dt4zge.jpg",
        is_primary: false,
        order: 1,
      },
      {
        image_url:
          "https://res.cloudinary.com/ygmmi186/image/upload/v1784755737/lsg_4_wl0twl.jpg",
        is_primary: false,
        order: 2,
      },
      {
        image_url:
          "https://res.cloudinary.com/ygmmi186/image/upload/v1784755737/lsg_3_pdrmqj.jpg",
        is_primary: false,
        order: 3,
      },
    ],
  },
  {
    title: "Entrada 2026: Looking for Volunteers",
    slug: "entrada-2026-looking-for-volunteers",
    type: PostType.announcement,
    published: true,
    grid_type: GridType.SINGLE,
    created_by_username: "admin",
    content: ` 𝙏𝙊 𝙇𝙀𝘼𝘿 𝘼𝙉𝘿 𝙏𝙊 𝙎𝙀𝙍𝙑𝙀 𝙁𝙊𝙍 𝙀𝙉𝙏𝙍𝘼𝘿𝘼 2026! 

As Entrada 2026 rapidly approaches, the  𝐶𝑜𝑙𝑙𝑒𝑔𝑒 𝑜𝑓 𝐶𝑜𝑚𝑝𝑢𝑡𝑖𝑛𝑔 𝑎𝑛𝑑 𝐼𝑛𝑓𝑜𝑟𝑚𝑎𝑡𝑖𝑜𝑛 𝑆𝑐𝑖𝑒𝑛𝑐𝑒𝑠 (𝐶𝐶𝐼𝑆) is officially opening applications for our Working Committees!

We are recruiting 𝒑𝒂𝒔𝒔𝒊𝒐𝒏𝒂𝒕𝒆, 𝒅𝒓𝒊𝒗𝒆𝒏, 𝒂𝒏𝒅 𝒅𝒆𝒅𝒊𝒄𝒂𝒕𝒆𝒅 working committee members ready to collaborate, innovate, and bring our college to the top.

* **Form Here:** [https://forms.gle/Y5rLFdcSA3gmrs6w5]( https://forms.gle/Y5rLFdcSA3gmrs6w5)
* **Recruitment Period Ends:** July 21, 2026 at 11:59 PM

𝑳𝑬𝑨𝑫 𝑾𝑰𝑻𝑯 𝑰𝑵𝑻𝑬𝑮𝑹𝑰𝑻𝒀,
𝑺𝑼𝑪𝑪𝑬𝑬𝑫 𝑻𝑯𝑹𝑶𝑼𝑮𝑯 𝑼𝑵𝑰𝑻𝒀!`,
    post_images: [
      {
        image_url:
          "https://res.cloudinary.com/ygmmi186/image/upload/v1784753446/volunteer_h6dn2u.jpg",
        is_primary: true,
        order: 0,
      },
    ],
  },
  {
    title: "Next Stop: Interview Phase for Appointed Officers (AY 2026–2027)",
    slug: "next-stop-interview-phase-appointed-officers-2026-2027",
    type: PostType.announcement,
    published: true,
    grid_type: GridType.SINGLE,
    created_by_username: "admin",
    content: `𝐍𝐄𝐗𝐓 𝐒𝐓𝐎𝐏: 𝐈𝐍𝐓𝐄𝐑𝐕𝐈𝐄𝐖 𝐏𝐇𝐀𝐒𝐄! 

𝐻𝑒𝑙𝑙𝑜, 𝑓𝑒𝑙𝑙𝑜𝑤 𝐶𝑜𝑙𝑙𝑒𝑔𝑒 𝑜𝑓 𝐶𝑜𝑚𝑝𝑢𝑡𝑖𝑛𝑔 𝑎𝑛𝑑 𝐼𝑛𝑓𝑜𝑟𝑚𝑎𝑡𝑖𝑜𝑛 𝑆𝑐𝑖𝑒𝑛𝑐𝑒𝑠 𝑠𝑡𝑢𝑑𝑒𝑛𝑡𝑠!

The journey to find our next student leaders continues! The pre-qualified list for 𝑨𝒑𝒑𝒐𝒊𝒏𝒕𝒆𝒅 𝑶𝒇𝒇𝒊𝒄𝒆𝒓𝒔 (𝑨𝒅𝒎𝒊𝒏 2026–2027) has officially been released. Find your 𝑰𝑫 𝒏𝒖𝒎𝒃𝒆𝒓 below and take the next step toward making an impact in our college. 

 𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐃 𝐃𝐎𝐂𝐔𝐌𝐄𝐍𝐓𝐒:
      - 𝐶𝑢𝑟𝑟𝑖𝑐𝑢𝑙𝑢𝑚 𝑉𝑖𝑡𝑎𝑒 (𝐶𝑉)
      - 𝐶𝑒𝑟𝑡𝑖𝑓𝑖𝑐𝑎𝑡𝑒 𝑜𝑓 𝑅𝑒𝑔𝑖𝑠𝑡𝑟𝑎𝑡𝑖𝑜𝑛 (𝐶𝑂𝑅) (𝑂𝑝𝑡𝑖𝑜𝑛𝑎𝑙)
      - 𝑃ℎ𝑜𝑡𝑜𝑐𝑜𝑝𝑦 𝑜𝑓 𝑆𝑡𝑢𝑑𝑒𝑛𝑡 𝐼𝐷

 𝐖𝐇𝐄𝐍 & 𝐖𝐇𝐄𝐑𝐄:
      - 𝑫𝒂𝒕𝒆 & 𝑻𝒊𝒎𝒆: 𝐽𝑢𝑙𝑦 22, 2026 | 𝑆𝑡𝑎𝑟𝑡𝑠 𝑎𝑡 1:00 𝑃𝑀
      - 𝑳𝒐𝒄𝒂𝒕𝒊𝒐𝒏: 𝑀𝑎𝑠𝑎𝑤𝑎 𝐻𝑎𝑙𝑙, 𝑅𝑜𝑜𝑚 104

Please ensure you have all your hard-copy documents ready and come prepared. We look forward to discovering your potential. Best of luck to all candidates! 

𝑳𝒆𝒂𝒅 𝒘𝒊𝒕𝒉 𝑰𝑵𝑻𝑬𝑮𝑹𝑰𝑻𝒀, 
𝑺𝒖𝒄𝒄𝒆𝒆𝒅 𝒕𝒉𝒓𝒐𝒖𝒈𝒉 𝑼𝑵𝑰𝑻𝒀!`,
    post_images: [
      {
        image_url:
          "https://res.cloudinary.com/ygmmi186/image/upload/v1784753446/call_for_applicants_1_doh3ms.jpg",
        is_primary: true,
        order: 0,
      },
      {
        image_url:
          "https://res.cloudinary.com/ygmmi186/image/upload/v1784753446/call_for_applicants_2_jeqrf0.jpg",
        is_primary: false,
        order: 1,
      },
    ],
  },
];

const SeedPosts = async () => {
  console.log("[11] Seeding Posts");

  let idx = 1;
  for (const post of SeedPostsData) {
    try {
      const user = await prisma.user.findUnique({
        where: { username: post.created_by_username },
      });

      if (!user) {
        console.warn(
          `[11.${idx}] User not found for post "${post.title}", skipping`,
        );
        idx++;
        continue;
      }

      const { created_by_username, post_images, ...postWithoutAuthor } = post;

      const result = await prisma.post.create({
        data: {
          ...postWithoutAuthor,
          author: {
            connect: { id: user.id },
          },
          ...(post_images?.length
            ? {
                images: {
                  create: post_images.map((img, imgIdx) => ({
                    image_url: img.image_url,
                    is_primary: img.is_primary ?? imgIdx === 0,
                    order: img.order ?? imgIdx,
                  })),
                },
              }
            : {}),
        },
        select: { id: true },
      });

      console.log(
        `[11.${idx}] Created Post: "${post.title}" (ID: ${result.id})`,
      );
      idx++;
    } catch (error) {
      console.error(`Failed to create post "${post.title}":`, error);
    }
  }

  console.log("[12] Posts Seed Complete");
};

const SeedInventoryCategories = async () => {
  console.log("[Seeding] Seeding Default Inventory Categories");
  await prisma.inventoryCategory.createMany({
    data: [
      {
        name: "Default",
        description:
          "Default category for unassigned or reallocated inventory items",
      },
      {
        name: "Office",
        description: "Office tools, stationery, paper, desks, and supplies",
      },
      {
        name: "Medicine & Health",
        description:
          "First aid kits, emergency medication, and clinic supplies",
      },
      {
        name: "Cleaning & Sanitation",
        description: "Janitorial supplies, disinfectants, and hygiene products",
      },
      {
        name: "IT & Computing",
        description:
          "Computers, network switches, cables, and hardware components",
      },
      {
        name: "Audio & Visual",
        description: "Microphones, speakers, projectors, and multimedia gear",
      },
      {
        name: "Sports & Recreation",
        description: "Balls, nets, sports kits, and recreational gear",
      },
      {
        name: "Laboratory",
        description:
          "Lab testing tools, experimental kits, and measuring devices",
      },
      {
        name: "Furniture & Fixtures",
        description: "Chairs, tables, cabinets, and boards",
      },
      {
        name: "Appliances",
        description: "Air conditioners, fans, and electrical appliances",
      },
      {
        name: "Events & Logistics",
        description: "Banners, event equipment, decorations, and props",
      },
    ],
    skipDuplicates: true,
  });
  console.log("[Seeding] Inventory Categories Seeded");
};

const SeedFeeItems = async () => {
  console.log("[Seeding] Seeding Default Fee Items & Merchandise");

  const admin = await prisma.user.findFirst({
    where: { role: { name: "System Admin" } },
  });

  const createdById = admin?.id;

  // 1. College Fee Item
  await prisma.feeItem.create({
    data: {
      name: "1st Sem Organization Fee",
      description: "Mandatory CCIS LSG membership fee for AY 2025-2026",
      price: 150.0,
      type: "cf",
      has_variants: false,
      quantity: 0,
      created_by: createdById,
    },
  });

  // 2. Merchandise Item with Variants (Sizes S, M, L)
  await prisma.feeItem.create({
    data: {
      name: "CCIS LSG Official Org Shirt 2026",
      description: "High quality cotton shirt with CCIS logo print",
      price: 350.0,
      type: "mf",
      has_variants: true,
      quantity: 50,
      created_by: createdById,
      variants: {
        create: [
          { name: "Small", quantity: 15 },
          { name: "Medium", quantity: 20 },
          { name: "Large", quantity: 15 },
        ],
      },
    },
  });

  // 3. Single Merchandise Item
  await prisma.feeItem.create({
    data: {
      name: "CCIS LSG Official Lanyard",
      description: "Sublimation printed ID lanyard with heavy duty clip",
      price: 85.0,
      type: "mf",
      has_variants: false,
      quantity: 100,
      created_by: createdById,
    },
  });

  console.log("[Seeding] Default Fee Items Seeded");
};

export async function main() {
  try {
    await ResetDatabase();
    await SeedRoles();
    await SeedPermissionCategoriesAndPermissions();
    await SeedUsers();
    await SeedPosts();
    await SeedInventoryCategories();
    await SeedFeeItems();
  } catch (error) {
    console.error("Seed execution failure: ", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();

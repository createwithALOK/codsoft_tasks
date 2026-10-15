require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The demo seed cannot run in production.');
  }
  if (process.env.RESET_DATABASE !== 'true') {
    throw new Error('This demo seed deletes all app data. Set RESET_DATABASE=true only for a disposable database.');
  }

  // ─── Clean up in reverse dependency order ───────────────────────────────
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑  Cleared existing data');

  // ─── Users ───────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const kitchenPassword = await bcrypt.hash('kitchen123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@dinedesk.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Kitchen Staff',
      email: 'kitchen@dinedesk.com',
      password: kitchenPassword,
      role: 'KITCHEN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Demo Customer',
      email: 'customer@dinedesk.com',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  console.log('👤  Created admin, kitchen, and customer users');

  // ─── Categories ──────────────────────────────────────────────────────────
  const starters = await prisma.category.create({
    data: { name: 'Starters', description: 'Delicious appetisers to kick off your meal', sortOrder: 1 },
  });

  const mainCourse = await prisma.category.create({
    data: { name: 'Main Course', description: 'Hearty and flavourful main dishes', sortOrder: 2 },
  });

  const desserts = await prisma.category.create({
    data: { name: 'Desserts', description: 'Sweet treats to end your dining experience', sortOrder: 3 },
  });

  const drinks = await prisma.category.create({
    data: { name: 'Drinks', description: 'Refreshing beverages and mocktails', sortOrder: 4 },
  });

  const specials = await prisma.category.create({
    data: { name: 'Specials', description: "Chef's signature and seasonal specials", sortOrder: 5 },
  });

  console.log('📂  Created 5 categories');

  // ─── Menu Items (18 items) ────────────────────────────────────────────────

  // Starters (4 items)
  await prisma.menuItem.create({
    data: {
      categoryId: starters.id,
      name: 'Paneer Tikka',
      description: 'Marinated cottage cheese cubes grilled in a tandoor with spiced yoghurt',
      price: 280,
      isVeg: true,
      spiceLevel: 2,
      preparationTime: 20,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: starters.id,
      name: 'Chicken Seekh Kebab',
      description: 'Minced chicken mixed with herbs and spices, skewered and grilled',
      price: 320,
      isVeg: false,
      spiceLevel: 2,
      preparationTime: 20,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: starters.id,
      name: 'Veg Spring Rolls',
      description: 'Crispy golden rolls stuffed with seasoned mixed vegetables',
      price: 200,
      isVeg: true,
      spiceLevel: 1,
      preparationTime: 15,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: starters.id,
      name: 'Mutton Shammi Kebab',
      description: 'Slow-cooked minced mutton patties with spices and fresh herbs',
      price: 380,
      isVeg: false,
      spiceLevel: 3,
      preparationTime: 25,
      isAvailable: true,
    },
  });

  // Main Course (5 items)
  await prisma.menuItem.create({
    data: {
      categoryId: mainCourse.id,
      name: 'Dal Makhani',
      description: 'Slow-cooked black lentils simmered overnight in butter and cream',
      price: 250,
      isVeg: true,
      spiceLevel: 1,
      preparationTime: 20,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mainCourse.id,
      name: 'Butter Chicken',
      description: 'Tender chicken in a rich, creamy tomato-based curry sauce',
      price: 380,
      isVeg: false,
      spiceLevel: 2,
      preparationTime: 25,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mainCourse.id,
      name: 'Palak Paneer',
      description: 'Fresh cottage cheese cubes in a smooth, spiced spinach gravy',
      price: 300,
      isVeg: true,
      spiceLevel: 1,
      preparationTime: 20,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mainCourse.id,
      name: 'Lamb Rogan Josh',
      description: 'Classic Kashmiri lamb curry with aromatic whole spices',
      price: 480,
      isVeg: false,
      spiceLevel: 3,
      preparationTime: 30,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mainCourse.id,
      name: 'Vegetable Biryani',
      description: 'Fragrant basmati rice layered with seasonal vegetables and saffron',
      price: 320,
      isVeg: true,
      spiceLevel: 2,
      preparationTime: 30,
      isAvailable: true,
    },
  });

  // Desserts (3 items)
  await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: 'Gulab Jamun',
      description: 'Soft milk-solid dumplings soaked in rose-flavoured sugar syrup',
      price: 150,
      isVeg: true,
      spiceLevel: 0,
      preparationTime: 10,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: 'Mango Kulfi',
      description: 'Traditional Indian ice cream made with condensed milk and Alphonso mango',
      price: 180,
      isVeg: true,
      spiceLevel: 0,
      preparationTime: 10,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: 'Chocolate Lava Cake',
      description: 'Warm dark-chocolate cake with a molten centre, served with vanilla ice cream',
      price: 220,
      isVeg: true,
      spiceLevel: 0,
      preparationTime: 15,
      isAvailable: true,
    },
  });

  // Drinks (3 items)
  await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: 'Mango Lassi',
      description: 'Chilled yoghurt-based drink blended with fresh Alphonso mango',
      price: 150,
      isVeg: true,
      spiceLevel: 0,
      preparationTime: 10,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: 'Masala Chai',
      description: 'Spiced Indian tea brewed with ginger, cardamom, and fresh milk',
      price: 80,
      isVeg: true,
      spiceLevel: 1,
      preparationTime: 10,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: 'Fresh Lime Soda',
      description: 'Sparkling water with freshly squeezed lime, black salt, and mint',
      price: 100,
      isVeg: true,
      spiceLevel: 0,
      preparationTime: 5,
      isAvailable: true,
    },
  });

  // Specials (3 items)
  await prisma.menuItem.create({
    data: {
      categoryId: specials.id,
      name: "Chef's Thali",
      description: "A royal spread: dal, sabzi, paneer, rice, naan, raita, and dessert",
      price: 650,
      isVeg: true,
      spiceLevel: 2,
      preparationTime: 25,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: specials.id,
      name: 'Tandoori Mixed Grill',
      description: 'Platter of chicken tikka, seekh kebab, fish tikka, and naan',
      price: 580,
      isVeg: false,
      spiceLevel: 2,
      preparationTime: 30,
      isAvailable: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: specials.id,
      name: 'Weekend Brunch Combo',
      description: 'Chole bhature, raita, pickle, and a glass of fresh juice',
      price: 350,
      isVeg: true,
      spiceLevel: 2,
      preparationTime: 20,
      isAvailable: true,
    },
  });

  console.log('🍽  Created 18 menu items');

  // ─── Tables ──────────────────────────────────────────────────────────────
  const tableData = [
    { tableNumber: 1,  capacity: 2,  location: 'Window'  },
    { tableNumber: 2,  capacity: 2,  location: 'Window'  },
    { tableNumber: 3,  capacity: 4,  location: 'Center'  },
    { tableNumber: 4,  capacity: 4,  location: 'Center'  },
    { tableNumber: 5,  capacity: 4,  location: 'Center'  },
    { tableNumber: 6,  capacity: 6,  location: 'Terrace' },
    { tableNumber: 7,  capacity: 6,  location: 'Terrace' },
    { tableNumber: 8,  capacity: 8,  location: 'Private' },
    { tableNumber: 9,  capacity: 8,  location: 'Private' },
    { tableNumber: 10, capacity: 10, location: 'Private' },
  ];

  for (const t of tableData) {
    await prisma.table.create({ data: { ...t, status: 'AVAILABLE' } });
  }

  console.log('🪑  Created 10 tables');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

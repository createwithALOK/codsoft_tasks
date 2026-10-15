const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeSpiceLevel(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const map = { MILD: 1, MEDIUM: 2, HOT: 3 };
  if (map[String(value).toUpperCase()] !== undefined) {
    return map[String(value).toUpperCase()];
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * GET /api/menu/categories
 * Return all categories ordered by sortOrder.
 */
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/menu/items
 * Return menu items with optional filtering (categoryId, search, isVeg).
 */
async function getItems(req, res, next) {
  try {
    const { categoryId, search, isVeg } = req.query;

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (isVeg !== undefined) where.isVeg = isVeg === 'true';
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/menu/items/:id
 * Return a single menu item by id, including its category.
 */
async function getItemById(req, res, next) {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/menu/categories  (ADMIN only)
 * Create a new category.
 */
async function createCategory(req, res, next) {
  try {
    const { name, description, imageUrl, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const category = await prisma.category.create({
      data: { name, description, imageUrl, sortOrder: sortOrder ?? 0 },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/menu/items  (ADMIN only)
 * Create a new menu item.
 */
async function createItem(req, res, next) {
  try {
    const {
      categoryId, name, description, price, imageUrl,
      isAvailable, isVeg, spiceLevel, preparationTime,
    } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'categoryId, name, and price are required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price,
        imageUrl,
        isAvailable: isAvailable ?? true,
        isVeg: isVeg ?? false,
        spiceLevel: normalizeSpiceLevel(spiceLevel),
        preparationTime: preparationTime ?? 15,
      },
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/menu/items/:id  (ADMIN only)
 * Update an existing menu item.
 */
async function updateItem(req, res, next) {
  try {
    const {
      categoryId, name, description, price, imageUrl,
      isAvailable, isVeg, spiceLevel, preparationTime,
    } = req.body;

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isVeg !== undefined && { isVeg }),
        ...(spiceLevel !== undefined && { spiceLevel: normalizeSpiceLevel(spiceLevel) }),
        ...(preparationTime !== undefined && { preparationTime }),
      },
    });

    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/menu/items/:id  (ADMIN only)
 * Soft-delete a menu item by marking it unavailable.
 */
async function deleteItem(req, res, next) {
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { isAvailable: false },
    });

    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, getItems, getItemById, createCategory, createItem, updateItem, deleteItem };

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNotices = async (req, res) => {
  try {
    const { role } = req.user;
    const now = new Date();
    const notices = await prisma.notice.findMany({
      where: {
        AND: [
          {
            OR: [
              { targetRole: null },
              { targetRole: role },
            ],
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, data: notices });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createNotice = async (req, res) => {
  try {
    const { title, content, targetRole, expiresAt } = req.body;
    const notice = await prisma.notice.create({
      data: {
        title, content,
        targetRole: targetRole || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return res.status(201).json({ success: true, message: 'Notice created.', data: notice });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteNotice = async (req, res) => {
  try {
    await prisma.notice.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Notice deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getNotices, createNotice, deleteNotice };

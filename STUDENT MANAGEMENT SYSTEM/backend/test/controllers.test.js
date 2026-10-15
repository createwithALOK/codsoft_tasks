const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

let createdUserData;
let noticeQuery;
const prismaModulePath = require.resolve('@prisma/client');
const originalPrismaModule = require.cache[prismaModulePath];

class TestPrismaClient {
  constructor() {
    this.user = {
      findUnique: async () => null,
      create: async ({ data }) => {
        createdUserData = data;
        return { id: 'test-user-id', email: data.email, role: data.role };
      },
    };
    this.notice = {
      findMany: async (query) => {
        noticeQuery = query;
        return [];
      },
    };
  }
}

require.cache[prismaModulePath] = {
  id: prismaModulePath,
  filename: prismaModulePath,
  loaded: true,
  exports: { PrismaClient: TestPrismaClient },
};

const { register } = require('../src/controllers/auth.controller');
const { getNotices } = require('../src/controllers/notice.controller');

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

before(() => {
  process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
});

after(() => {
  if (originalPrismaModule) {
    require.cache[prismaModulePath] = originalPrismaModule;
  } else {
    delete require.cache[prismaModulePath];
  }
  delete require.cache[require.resolve('../src/controllers/auth.controller')];
  delete require.cache[require.resolve('../src/controllers/notice.controller')];
});

test('public registration always creates a student, even when an admin role is requested', async () => {
  createdUserData = null;
  const res = response();

  await register({
    body: {
      email: 'new.user@example.com',
      password: 'a-long-test-password',
      role: 'ADMIN',
      firstName: 'New',
      lastName: 'User',
    },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createdUserData.role, 'STUDENT');
  assert.equal(createdUserData.student.create.firstName, 'New');
  assert.equal(res.body.data.role, 'STUDENT');
});

test('notice query combines role visibility and expiry filters', async () => {
  noticeQuery = null;
  const res = response();

  await getNotices({ user: { role: 'STUDENT' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(noticeQuery.where.AND.length, 2);
  assert.deepEqual(noticeQuery.where.AND[0].OR, [
    { targetRole: null },
    { targetRole: 'STUDENT' },
  ]);
  assert.equal(noticeQuery.where.AND[1].OR.length, 2);
});

const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
// let userId

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    await request(app).post('/api/auth').send(testUser);
    // userId = requestRes.body.user.id;
});

test('login', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

    // eslint-disable-next-line no-unused-vars
    const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
    expect(loginRes.body.user).toMatchObject(user);

    // Logout to prepare for the next test
    await request(app).delete('/api/auth').set('Authorization', `Bearer ${loginRes.body.token}`);
});

test('logout', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('logout successful');
});

test('register', async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    expect(registerRes.status).toBe(200);
    expect(registerRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

    // eslint-disable-next-line no-unused-vars
    const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
    expect(registerRes.body.user).toMatchObject(user);

    await request(app).delete('/api/auth').set('Authorization', `Bearer ${registerRes.body.token}`);
});

test('update user', async () => {

    const newTestUser = {
        email: Math.random().toString(36).substring(2, 12) + '@test.com',
        password: 'password123',
        name: 'original diner'
      };
    const registerRes = await request(app).post('/api/auth/').send(testUser);
    const authToken = registerRes.body.token;
    const newUserId = registerRes.body.user.id;

    newTestUser.name = 'new diner';
    const updateRes = await request(app).put('/api/auth/' + newUserId).set('Authorization', `Bearer ${authToken}`).send(newTestUser);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe(testUser.name);

    await request(app).delete('/api/auth').set('Authorization', `Bearer ${authToken}`);
});

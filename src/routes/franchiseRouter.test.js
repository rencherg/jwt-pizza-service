const request = require('supertest');
const app = require('../service');

// const adminUser = { name: '常用名字', email: 'a@jwt.com', password: 'admin' };
let adminAuthToken, adminUser, adminUserId;

const { Role, DB } = require('../database/database.js');

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = Math.random().toString(36).substring(2, 12);
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}

beforeAll(async () => {
    adminUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    adminAuthToken = loginRes.body.token;
    adminUserId = loginRes.body.user.id;
});

test('get franchises', async () => {

    const getRes = await request(app).get('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`);
    expect(getRes.status).toBe(200);

});

test('create Franchise', async () => {
    
    const requestData = {
        name: Math.random().toString(36).substring(2, 12) + 'pizza',
        admins: [{ email: adminUser.email }]
    };
  
    const response = await request(app)
        .post('/api/franchise')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(requestData);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(requestData.name);
    expect(response.body.admins[0].email).toBe(adminUser.email);

    const franchiseId = response.body.id;

    await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${adminAuthToken}`);
});

test('get all user franchises', async () => {
    
    const requestData = {
        name: Math.random().toString(36).substring(2, 12) + 'pizza',
        admins: [{ email: adminUser.email }]
    };
  
    const response = await request(app)
        .post('/api/franchise')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(requestData);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(requestData.name);
    expect(response.body.admins[0].email).toBe(adminUser.email);

    // const franchiseId = response.body.id;

    const getFranchisesResponse = await request(app)
        .get(`/api/franchise/${adminUserId}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(requestData);

    expect(getFranchisesResponse.status).toBe(200);
    expect(getFranchisesResponse.body.length).toBeGreaterThan(0);
});

test('create Store', async () => {
    const requestData = {
        name: Math.random().toString(36).substring(2, 12) + 'pizza',
        admins: [{ email: adminUser.email }]
    };
  
    const response = await request(app)
        .post('/api/franchise')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(requestData);

    expect(response.status).toBe(200);

    const franchiseId = response.body.id;

    const store = { name: 'myStore' };

    const createStoreRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(store);
    expect(createStoreRes.status).toBe(200);
    expect(createStoreRes.body.name).toBe('myStore');

    await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${adminAuthToken}`);
});

test('delete franchise', async () => {

    const requestData = {
        name: Math.random().toString(36).substring(2, 12) + 'pizza',
        admins: [{ email: adminUser.email }]
    };
  
    const createRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(requestData);
    expect(createRes.status).toBe(200);
  
    const franchiseId = createRes.body.id;
  
    const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe('franchise deleted');
  });

test('delete a store', async () => {

    const requestData = {
        name: Math.random().toString(36).substring(2, 12) + 'pizza',
        admins: [{ email: adminUser.email }]
    };
  
    const response = await request(app)
        .post('/api/franchise')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(requestData);

    expect(response.status).toBe(200);

    const franchiseId = response.body.id;

    const store = { name: 'myStore' };

    const createStoreRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(store);
    expect(createStoreRes.status).toBe(200);
    expect(createStoreRes.body.name).toBe('myStore');

    const storeId = createStoreRes.body.id;

    const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}/store/${storeId}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe('store deleted');

    await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${adminAuthToken}`);
  });

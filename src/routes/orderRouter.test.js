const request = require('supertest');
const app = require('../service');
// require('jest-fetch-mock').enableMocks();

const adminUser = { name: '常用名字', email: 'a@jwt.com', password: 'admin' };
let adminAuthToken, franchiseId;

beforeAll(async () => {
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    adminAuthToken = loginRes.body.token;

    const requestData = {
        name: Math.random().toString(36).substring(2, 12) + 'pizza',
        admins: [{ email: adminUser.email }]
    };
  
    const response = await request(app)
        .post('/api/franchise')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(requestData);

    // expect(response.status).toBe(200);

    franchiseId = response.body.id;

    const store = { name: 'myStore' };

    await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(store);
    // expect(createStoreRes.status).toBe(200);
    // expect(createStoreRes.body.name).toBe('myStore');

    // storeId = createStoreRes.body.id;
});

test('create a menu item', async () => {

    const newMenuItem = {
        title: Math.random().toString(36).substring(2, 12) + 'goodpizza',
        description: 'Pepe enters the kitchen...', 
        image: 'pizza2.png',
        price: '17.76'
    };
  
    const createRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(newMenuItem);
    expect(createRes.status).toBe(200);

    const getRes = await request(app).get('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`)
    expect(getRes.status).toBe(200);

    const body = getRes.body;
    let foundPepe = false
    body.forEach(item => {
        if (item.title === newMenuItem.title) {
            foundPepe = true;
        }
    });
    expect(foundPepe).toBe(true);
  });

// test('create an order item negative', async () => {

//     const newMenuItem = {
//         title: Math.random().toString(36).substring(2, 12) + 'goodpizza',
//         description: 'Pepe enters the kitchen...', 
//         image: 'pizza2.png',
//         price: '17.76'
//     };
  
//     const createRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(newMenuItem);
//     expect(createRes.status).toBe(200);

//     const getRes = await request(app).get('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`)
//     expect(getRes.status).toBe(200);

//     fetch.mockResolvedValue(new Response(JSON.stringify({ reportUrl: 'http://factory.com/report', jwt: 'factory-jwt' }), { status: 200 }));

//     const orderReq = { items: 
//         [{ 
//             name: Math.random().toString(36).substring(2, 12) + 'goodpizza',
//             quantity: 1
//         }] 
//     };

//     const createOrderRes = await request(app)
//       .post('/api/order')
//       .set('Authorization', `Bearer ${adminAuthToken}`)
//       .send(orderReq);

//     expect(createOrderRes.status).toBe(500);
//   });

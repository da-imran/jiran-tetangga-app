/* eslint-disable no-undef */
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mongoFx = require('../utilities/mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const should = chai.should();
chai.use(chaiHttp);

const ROUTE_PREPEND = process.env.ROUTE_PREPEND || 'jiran-tetangga';
const VERSION = process.env.VERSION || 'v1';

let server;
before(async () => {
	const appFactory = require('./testServer');
	server = await appFactory(); // Initialize app with mocked setup
});

afterEach(() => {
	sinon.restore(); // Restore stubs after each test
});

// Admin user Module
describe('ADM: Admin Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		firstName: 'Muhammad Ehsan',
		lastName: 'Imran',
		email: 'ehsan.imran@gmail.com',
		password: 'Ehsan123',
		phone: '0123456789'
	};

	const adminData = {
		_id: fakeId,
		firstName: 'Muhammad Ehsan',
		lastName: 'Imran',
		createdAt: new Date().toISOString()
	};

	it('ADM-001: POST - Create Admin User', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });
	
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/adminUsers`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('adminId');
                    
				done();
			});
	});

	it('ADM-002: GET - Get All Admin Users', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(adminData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/adminUsers`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');
                    
				done();
			});
	});


	it('ADM-003: GET - Get Admin User by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(adminData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/adminUser/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('ADM-004: PATCH - Update Admin User', (done) => {
		const updatedPayload = {
			firstName: 'Ehsan',
		};

		const adminData = {
			_id: fakeId,
			firstName: 'Muhammad Ehsan',
			lastName: 'Imran',
			createdAt: new Date().toISOString()
		};

		const updateResult = {
			_id: fakeId,
			firstName: 'Ehsan',
			lastName: 'Imran',
			email: 'ios.imran@gmail.com',
			password: 'U2FsdGVkX1/5+p3NiteLynq1ZOivCveI/V814kZZMh8=',
			phone: '0123456789',
			createdAt: '2025-06-28T10:07:07.985Z'
		};

		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(adminData);
		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/adminUsers/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});
    
	it('ADM-005: DELETE - Delete Admin User', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(adminData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/adminUsers/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

});

// Road Disruptions Module
describe('DSP: Disruption Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		title: 'Jalan Cenderai Water Pipe Burst',
		category: 'informational',
		description: 'Jalan Cenderai Water Pipe Burst',
		adminId: '685fbecb335bdc41ca63fa4a'
	};

	const disruptionData = {
		_id: fakeId,
		title: 'Jalan Cenderai Water Pipe Burst',
		category: 'informational',
		description: 'Jalan Cenderai Water Pipe Burst',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	it('DSP-001: POST - Create Admin User', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });
	
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/disruptions`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');
                    
				done();
			});
	});

	it('DSP-002: GET - Get All Disruptions', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(disruptionData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/disruptions`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');
                    
				done();
			});
	});


	it('DSP-003: GET - Get Disruption by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(disruptionData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/disruptions/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('DSP-004: PATCH - Update Disruption', (done) => {
		const updatedPayload = {
			status: true,
			adminId: '685fbecb335bdc41ca63fa4a'
		};

		const updateResult = {
			_id: fakeId,
			title: 'Jalan Cenderai Water Pipe Burst',
			description: 'Jalan Cenderai Water Pipe Burst',
			status: true,
			createdAt: '2025-07-05T14:54:23.266Z',
			updatedAt: '2025-07-20T09:59:03.366Z'
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/disruptions/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});
    
	it('DSP-005: DELETE - Delete Disruption', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(disruptionData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/disruptions/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');
				
				done();
			});
	});

});

// Parks Module
describe('PRK: Park Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		name: 'Taman Permainan Sg Tiram',
		description: 'The park is closed until further notice',
		openingHours: {
			opening: '0000',
			closing: '0000'
		},
		adminId: '685fbecb335bdc41ca63fa4a'
	};

	const parkData = {
		_id: fakeId,
		name: 'Taman Rekreasi Sungai Tiram',
		description: 'Jogging track in the park closed for maintenance.',
		status: 'maintenance',
		openingHours: {
			opening: '0600',
			closing: '2330'
		},
		createdAt: '2025-07-06T14:01:10.989Z',
		updatedAt: '2025-07-08T14:53:37.957Z'
	};

	it('PRK-001: POST - Create Park', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });
	
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/parks`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');
                    
				done();
			});
	});

	it('PRK-002: GET - Get All Parks', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(parkData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/parks`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');
                    
				done();
			});
	});


	it('PRK-003: GET - Get Park by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(parkData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/parks/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('PRK-004: PATCH - Update Park', (done) => {
		const updatedPayload = {
			status: 'MAINTENANCE',
		};

		const updateResult = {
			_id: fakeId,
			name: 'Taman Rekreasi Sungai Tiram',
			description: 'Jogging track in the park closed for maintenance.',
			status: 'MAINTENANCE',
			openingHours: {
				opening: '0600',
				closing: '2330'
			},
			createdAt: '2025-07-06T14:01:10.989Z',
			updatedAt: '2025-07-08T14:53:37.957Z'
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/parks/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});
    
	it('PRK-005: DELETE - Delete Park', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(parkData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/parks/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');
				
				done();
			});
	});

});

// Events Module
describe('EVT: Event Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		title: 'Let Zumba!',
		description: 'There is a Zumba class at the park. Come join us!',
		organizerName: 'Ehsan',
		organizerEmail: 'ios.imran@gmail.com',
		eventDate: '2025-07-15T00:00:00.000Z',
		location: 'Taman Rekreasi Sungai Tiram'
	};

	const eventData = {
		_id: '686a8a13c4383d5683602e04',
		title: 'Let\'s Zumba! 2',
		description: 'There is a Zumba class at the park. Come join us!',
		organizerName: 'Ehsan',
		organizerEmail: 'ios.imran@gmail.com',
		eventDate: '2025-07-15T16:00:00.000Z',
		location: 'Taman Rekreasi Sungai Tiram',
		createdAt: '2025-07-06T14:37:07.781Z',
		adminId: '685fbecb335bdc41ca63fa4a',
		status: 'approved'
	};

	it('EVT-001: POST - Create Event', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });
	
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/events`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');
                    
				done();
			});
	});

	it('EVT-002: GET - Get All Event', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(eventData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/events`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');
                    
				done();
			});
	});


	it('EVT-003: GET - Get Event by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(eventData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/events/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('EVT-004: PATCH - Update Event', (done) => {
		const updatedPayload = {
			title: 'Lets Zumba',
			adminId: '685fbecb335bdc41ca63fa4a'
		};

		const updateResult = {
			_id: fakeId,
			title: 'Lets Zumba!',
			descriptiom: 'There is a Zumba class at the park. Come join us!',
			organizerName: 'Ehsan',
			organizerEmail: 'ios.imran@gmail.com',
			eventDate: '2025-07-15T16:00:00.000Z',
			location: 'Taman Rekreasi Sungai Tiram',
			createdAt: '2025-07-06T14:37:07.781Z',
			adminId: '685fbecb335bdc41ca63fa4a',
			status: 'approved'
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/events/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});
    
	it('EVT-005: DELETE - Delete Event', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(eventData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/events/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');
				
				done();
			});
	});

});

// Shops Module
describe('SHP: Shop Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		name: 'Coffe Bean & Tea Leaf',
		description: 'Your favorite local coffee shop',
		location: 'Lot 1/1A, Jalan Sungai Tiram 1',
		openingHours: {
			opening: '900',
			closing: '2330'
		}
	};

	const shopData = {
		_id: '686a919bceb4106abf205036',
		name: 'Coffe Bean & Tea Leaf',
		description: 'Closed until further notice due to maintenance',
		status: 'maintenance',
		location: 'Lot 1/1A, Jalan Sungai Tiram 1',
		openingHours: {
			opening: '1000',
			closing: '2330'
		},
		createdAt: '2025-07-06T15:09:15.107Z',
		updatedAt: '2025-07-16T13:27:24.657Z'
	};

	it('SHP-001: POST - Create Shop', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });
	
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/shops`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');
                    
				done();
			});
	});

	it('SHP-002: GET - Get All Shop', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(shopData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/shops`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');
                    
				done();
			});
	});


	it('SHP-003: GET - Get Shop by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(shopData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/shops/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('SHP-004: PATCH - Update Shop', (done) => {
		const updatedPayload = {
			status: 'OPEN',
			adminId: '685fbecb335bdc41ca63fa4a'
		};

		const updateResult = {
			_id: fakeId,
			name: 'Coffe Bean & Tea Leaf',
			description: 'Your favorite local coffee shop',
			status: 'OPEN',
			location: 'Lot 1/1A, Jalan Sungai Tiram 1',
			openingHours: {
				opening: '0900',
				closing: '2330'
			},
			createdAt: '2025-07-06T15:09:15.107Z',
			updatedAt: '2025-07-20T10:03:20.365Z'
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/shops/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});
    
	it('SHP-005: DELETE - Delete Shop', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(shopData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/shops/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');
				
				done();
			});
	});

});

// Reports Module
describe('RPT: Report Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';


	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		email: 'ios.imran@gmail.com',
		description: 'Your favorite local coffee shop',
		location: 'Lot 1/1A, Jalan Sungai Tiram 1',
		category: 'road-disruption'
	};

	const reportData = {
		_id: fakeId,
		email: 'ios.imran@gmail.com',
		description: 'Your favorite local coffee shop',
		location: 'Lot 1/1A, Jalan Sungai Tiram 1',
		category: 'road-disruption',
		images: null,
		status: 'approved',
		createdAt: '2025-07-17T14:29:37.006Z'
	};

	it('RPT-001: POST - Create Report', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });
	
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/reports`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');
                    
				done();
			});
	});

	it('RPT-002: GET - Get All Report', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(reportData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/reports`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');
                    
				done();
			});
	});


	it('RPT-003: GET - Get Report by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(reportData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/reports/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('RPT-004: PATCH - Update Report', (done) => {
		const updatedPayload = {
			status: 'approved',
			category: 'road-disruption'
		};

		const updateResult = {
			_id: fakeId,
			email: 'ios.imran@gmail.com',
			description: 'Your favorite local coffee shop',
			location: 'Lot 1/1A, Jalan Sungai Tiram 1',
			category: 'road-disruption',
			images: null,
			status: 'pending',
			createdAt: '2025-07-17T14:29:37.006Z'
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/reports/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});
    
	it('RPT-005: DELETE - Delete Report', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(reportData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/reports/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');
				
				done();
			});
	});

});

// Contacts Module
describe('CTC: Contact Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		name: 'Police Station',
		number: '999',
	};

	const contactData = {
		_id: '685fbecb335bdc41ca63fa4a',
		name: 'Police Station',
		number: '999',
	};

	it('CTC-001: POST - Create Contact', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });
	
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/contact`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				console.log(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');
                    
				done();
			});
	});

	it('CTC-002: GET - Get All Contacts', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(contactData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/contacts`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');
                    
				done();
			});
	});


	it('CTC-003: GET - Get Contact by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(contactData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/contact/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('CTC-004: PATCH - Update Contact', (done) => {
		const updatedPayload = {
			status: 'active',
		};

		const updateResult = {
			_id: fakeId,
			name: 'Police',
			number: '999',
			status: 'active',
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/contact/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});
    
	it('CTC-005: DELETE - Delete Contact', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(contactData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/contact/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

});

// Incidents Module
describe('INC: Incidents Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		title: 'Test Incident',
		description: 'Test description',
		type: 'pothole',
		severity: 'medium',
		lat: 3.1145,
		lng: 101.6213
	};

	const incidentData = {
		_id: fakeId,
		title: 'Test Incident',
		description: 'Test description',
		type: 'pothole',
		severity: 'medium',
		lat: 3.1145,
		lng: 101.6213,
		reports: 1,
		status: 'pending',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	it('INC-001: POST - Create Incident', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/incident`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');

				done();
			});
	});

	it('INC-002: GET - Get All Incidents', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(incidentData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/incidents`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');

				done();
			});
	});

	it('INC-003: GET - Get Incident by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(incidentData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/incident/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('INC-004: PATCH - Update Incident', (done) => {
		const updatedPayload = {
			title: 'Updated Test Incident',
		};

		const updateResult = {
			_id: fakeId,
			title: 'Updated Test Incident',
			description: 'Test description',
			type: 'pothole',
			severity: 'medium',
			lat: 3.1145,
			lng: 101.6213,
			reports: 1,
			status: 'pending',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/incident/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	it('INC-005: DELETE - Delete Incident', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(incidentData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/incident/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	it('INC-006: POST - Report Incident', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves({
			_id: fakeId,
			title: 'Test Incident',
			description: 'Test description',
			type: 'pothole',
			severity: 'medium',
			lat: 3.1145,
			lng: 101.6213,
			reports: 2,
			status: 'pending',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/incident/${fakeId}/report`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	// Validation Tests
	it('INC-007: POST - Validate Type Enum', (done) => {
		const invalidPayload = {
			...inputPayload,
			type: 'invalid_type'
		};

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/incident`)
			.send(invalidPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: invalid type value');

				done();
			});
	});

	it('INC-008: POST - Validate Severity Enum', (done) => {
		const invalidPayload = {
			...inputPayload,
			severity: 'invalid_severity'
		};

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/incident`)
			.send(invalidPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: invalid severity value');

				done();
			});
	});

	it('INC-009: POST - Validate Lat/Lng Numbers', (done) => {
		const invalidPayload = {
			...inputPayload,
			lat: 'not_a_number',
			lng: 101.6213
		};

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/incident`)
			.send(invalidPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: lat and lng must be numbers');

				done();
			});
	});
});

// Marketplace Module
describe('MPL: Marketplace Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		title: 'Test Listing',
		description: 'Test description',
		category: 'food',
		price: 25.99,
		seller: 'test_seller',
		location: 'Test Location',
		contact: '1234567890',
		tags: ['test', 'sample']
	};

	const listingData = {
		_id: fakeId,
		title: 'Test Listing',
		description: 'Test description',
		category: 'food',
		price: 25.99,
		seller: 'test_seller',
		location: 'Test Location',
		contact: '1234567890',
		tags: ['test', 'sample'],
		status: 'pending',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	it('MPL-001: POST - Create Listing', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/listing`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');

				done();
			});
	});

	it('MPL-002: GET - Get All Listings', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(listingData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/listings`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');

				done();
			});
	});

	it('MPL-003: GET - Get Listing by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(listingData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/listing/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('MPL-004: PATCH - Update Listing', (done) => {
		const updatedPayload = {
			title: 'Updated Test Listing',
		};

		const updateResult = {
			_id: fakeId,
			title: 'Updated Test Listing',
			description: 'Test description',
			category: 'food',
			price: 25.99,
			seller: 'test_seller',
			location: 'Test Location',
			contact: '1234567890',
			tags: ['test', 'sample'],
			status: 'pending',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/listing/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	it('MPL-005: DELETE - Delete Listing', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(listingData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/listing/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	it('MPL-006: POST - Mark Listing as Sold', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves({
			_id: fakeId,
			title: 'Test Listing',
			description: 'Test description',
			category: 'food',
			price: 25.99,
			seller: 'test_seller',
			location: 'Test Location',
			contact: '1234567890',
			tags: ['test', 'sample'],
			status: 'sold',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/listing/${fakeId}/sold`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	// Validation Tests
	it('MPL-007: POST - Validate Category Enum', (done) => {
		const invalidPayload = {
			...inputPayload,
			category: 'invalid_category'
		};

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/listing`)
			.send(invalidPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: invalid category value');

				done();
			});
	});

	it('MPL-008: POST - Validate Price Non-Negative', (done) => {
		const invalidPayload = {
			...inputPayload,
			price: -5.00
		};

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/listing`)
			.send(invalidPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: price must be a non-negative number');

				done();
			});
	});
});

// LostFound Module
describe('LFG: Lost & Found Module', () => {
	let mongoStub;
	let secMongoStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';

	afterEach(() => {
		// Restore stub after each test scenario
		if (mongoStub) mongoStub.restore();
		if (secMongoStub) secMongoStub.restore();
	});

	const inputPayload = {
		status: 'lost',
		category: 'pet',
		title: 'Test Lost/Found Item',
		description: 'Test description',
		location: 'Test Location',
		contact: '1234567890',
		image: 'test_image.jpg',
		resolved: false,
		verified: false
	};

	const lostFoundData = {
		_id: fakeId,
		status: 'lost',
		category: 'pet',
		title: 'Test Lost/Found Item',
		description: 'Test description',
		location: 'Test Location',
		contact: '1234567890',
		image: 'test_image.jpg',
		resolved: false,
		verified: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	it('LFG-001: POST - Create LostFound Item', (done) => {
		mongoStub = sinon.stub(mongoFx, 'insertOne');
		mongoStub.resolves({ acknowledged: true, insertedId: fakeId });

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/lostFound`)
			.send(inputPayload)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');

				res.body.should.have.property('message');
				res.body.should.have.property('_id');

				done();
			});
	});

	it('LFG-002: GET - Get All LostFound Items', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(lostFoundData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/lostFound`)
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('data');

				done();
			});
	});

	it('LFG-003: GET - Get LostFound Item by ID', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(lostFoundData);

		chai.request(server)
			.get(`/${ROUTE_PREPEND}/${VERSION}/lostFound/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('data');

				done();
			});
	});

	it('LFG-004: PATCH - Update LostFound Item', (done) => {
		const updatedPayload = {
			title: 'Updated Test Lost/Found Item',
		};

		const updateResult = {
			_id: fakeId,
			status: 'lost',
			category: 'pet',
			title: 'Updated Test Lost/Found Item',
			description: 'Test description',
			location: 'Test Location',
			contact: '1234567890',
			image: 'test_image.jpg',
			resolved: false,
			verified: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves(updateResult);

		chai.request(server)
			.patch(`/${ROUTE_PREPEND}/${VERSION}/lostFound/${fakeId}`)
			.send(updatedPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	it('LFG-005: DELETE - Delete LostFound Item', (done) => {
		mongoStub = sinon.stub(mongoFx, 'find');
		mongoStub.resolves(lostFoundData);

		secMongoStub = sinon.stub(mongoFx, 'deleteOne');
		secMongoStub.resolves({
			acknowledged: true,
			deletedCount: 1
		});

		chai.request(server)
			.delete(`/${ROUTE_PREPEND}/${VERSION}/lostFound/${fakeId}`)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(200);
				res.body.should.have.property('message');
				res.body.should.have.property('data');

				done();
			});
	});

	// Validation Tests
	it('LFG-006: POST - Validate Status Enum', (done) => {
		const invalidPayload = {
			...inputPayload,
			status: 'invalid_status'
		};

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/lostFound`)
			.send(invalidPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: invalid status value');

				done();
			});
	});

	it('LFG-007: POST - Validate Category Enum', (done) => {
		const invalidPayload = {
			...inputPayload,
			category: 'invalid_category'
		};

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/lostFound`)
			.send(invalidPayload)
			.end((err, res) => {
				if (err) console.log(err);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: invalid category value');

				done();
			});
	});
});

// Forgot Password Module
describe('FP: Forgot Password Module', () => {
	let mongoStub;
	let jwtStub;

	const fakeId = '685fbecb335bdc41ca63fa4a';
	const fakeEmail = 'test@example.com';
	const fakeToken = 'fake.jwt.token';

	const adminData = {
		_id: fakeId,
		firstName: 'Test',
		lastName: 'User',
		email: fakeEmail,
		createdAt: new Date().toISOString()
	};

	afterEach(() => {
		if (mongoStub) mongoStub.restore();
		if (jwtStub) jwtStub.restore();
	});

	it('FP-001: POST - Forgot Password with existing email', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(adminData);
		jwtStub = sinon.stub(jwt, 'sign');
		jwtStub.returns(fakeToken);

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/forgot-password`)
			.send({ email: fakeEmail })
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('status').equal(200);
				res.body.should.have.property('message').equal('If the email exists, a reset link has been sent.');
				done();
			});
	});

	it('FP-002: POST - Forgot Password with non-existing email (security)', (done) => {
		mongoStub = sinon.stub(mongoFx, 'findOne');
		mongoStub.resolves(null);

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/forgot-password`)
			.send({ email: 'nonexistent@example.com' })
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('status').equal(200);
				res.body.should.have.property('message').equal('If the email exists, a reset link has been sent.');
				done();
			});
	});

	it('FP-003: POST - Forgot Password missing email', (done) => {
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/forgot-password`)
			.send({})
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: email is a required parameter.');
				done();
			});
	});

	it('FP-004: POST - Reset Password with valid token', (done) => {
		const newPassword = 'NewSecurePass123!';
		mongoStub = sinon.stub(mongoFx, 'findOneAndUpdate');
		mongoStub.resolves({ _id: fakeId, email: fakeEmail });
		jwtStub = sinon.stub(jwt, 'verify');
		jwtStub.returns({ userId: fakeId, purpose: 'password_reset' });

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/reset-password`)
			.send({ token: 'valid.token.here', newPassword })
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('status').equal(200);
				res.body.should.have.property('message').equal('Password has been reset successfully.');
				done();
			});
	});

	it('FP-005: POST - Reset Password with invalid token', (done) => {
		jwtStub = sinon.stub(jwt, 'verify');
		jwtStub.throws(new Error('Invalid token'));

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/reset-password`)
			.send({ token: 'invalid.token', newPassword: 'NewPass123!' })
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Invalid or expired reset token');
				done();
			});
	});

	it('FP-006: POST - Reset Password missing fields', (done) => {
		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/reset-password`)
			.send({})
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Bad request: token is a required parameter.');
				done();
			});
	});

	it('FP-007: POST - Reset Password too short', (done) => {
		jwtStub = sinon.stub(jwt, 'verify');
		jwtStub.returns({ userId: fakeId, purpose: 'password_reset' });

		chai.request(server)
			.post(`/${ROUTE_PREPEND}/${VERSION}/reset-password`)
			.send({ token: 'valid.token.format', newPassword: '123' })
			.end((err, res) => {
				if (err) console.log(err);
				should.exist(res.body);
				res.should.have.status(400);
				res.body.should.have.property('status').equal(400);
				res.body.should.have.property('message').equal('Password must be at least 8 characters long');
				done();
			});
	});
});

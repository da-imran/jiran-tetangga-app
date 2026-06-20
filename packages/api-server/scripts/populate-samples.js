/**
 * Populate sample data for all modules
 * Run with: node scripts/populate-samples.js
 */

require('dotenv').config();
const { clientConnect } = require('../utilities/mongodb');
const http = require('http');

/**
 * Makes an HTTP POST request to the API
 * @param {string} path - The API endpoint path (e.g., '/adminUsers')
 * @param {object} data - The data to send in the request body
 * @returns {Promise<object>} - The parsed JSON response
 */
function postToApi(path, data) {
	return new Promise((resolve, reject) => {
		const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8118}`;
		const routePrepend = process.env.ROUTE_PREPEND || 'jiran-tetangga';
		const version = process.env.VERSION || 'v1';

		// Remove trailing slash from apiBaseUrl if present
		const baseUrl = apiBaseUrl.replace(/\/$/, '');
		const fullPath = `/${routePrepend}/${version}${path}`;
		const fullUrl = `${baseUrl}${fullPath}`;

		// Parse the URL to get hostname, port, and path
		const urlObj = new URL(fullUrl);

		const options = {
			hostname: urlObj.hostname,
			port: urlObj.port,
			path: urlObj.pathname,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		};

		const req = http.request(options, (res) => {
			let rawData = '';
			res.on('data', chunk => { rawData += chunk; });
			res.on('end', () => {
				try {
					const parsedData = JSON.parse(rawData);
					if (res.statusCode >= 200 && res.statusCode < 300) {
						resolve(parsedData);
					} else {
						reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsedData || rawData)}`));
					}
				} catch (e) {
					// If not JSON, reject with raw data
					reject(new Error(`HTTP ${res.statusCode}: ${rawData}`));
				}
			});
		});

		req.on('error', reject);
		req.write(JSON.stringify(data));
		req.end();
	});
}

const sampleData = {
	adminUsers: [
		{
			firstName: 'Admin',
			lastName: 'User',
			email: 'admin@example.com',
			password: 'Admin@123',
			phone: '+60123456789'
		}
	],
	bookings: Array.from({ length: 10 }, (_, i) => ({
		userId: `user${i + 1}`,
		facilityId: `facility${((i % 10) + 1)}`,
		date: new Date(2026, 0, 15 + i), // Jan 15-24, 2026
		startTime: `${10 + i}:00`,
		endTime: `${11 + i}:00`,
		status: ['confirmed', 'pending', 'cancelled'][i % 3],
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	contacts: [
		{
			name: 'John Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			message: 'This is a sample contact message.',
			createdAt: new Date()
		}
	],
	disruptions: Array.from({ length: 10 }, (_, i) => ({
		title: `Sample Disruption ${i + 1}`,
		description: `This is a sample disruption description for disruption ${i + 1}.`,
		startDate: new Date(2026, 0, 10 + i),
		endDate: new Date(2026, 0, 12 + i),
		severity: ['low', 'medium', 'high'][i % 3],
		status: ['active', 'resolved'][i % 2],
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	events: Array.from({ length: 10 }, (_, i) => ({
		title: `Sample Event ${i + 1}`,
		description: `This is a sample event description for event ${i + 1}.`,
		date: new Date(2026, 0, 20 + i),
		startTime: '18:00',
		endTime: '21:00',
		location: `Location ${i + 1}`,
		capacity: 50 + i * 10,
		registered: i * 5,
		status: ['upcoming', 'ongoing', 'completed'][i % 3],
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	facilities: Array.from({ length: 10 }, (_, i) => ({
		name: `Sample Facility ${i + 1}`,
		description: `This is a sample facility description for facility ${i + 1}.`,
		type: ['sports', 'meeting', 'social'][i % 3],
		capacity: 20 + i * 5,
		location: `Building ${i + 1}, Room ${100 + i}`,
		isAvailable: true,
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	marketplace: Array.from({ length: 10 }, (_, i) => ({
		title: `Sample Item ${i + 1}`,
		description: `This is a sample marketplace item description for item ${i + 1}.`,
		price: 10 + i * 5,
		condition: ['new', 'like new', 'used'][i % 3],
		category: ['tuition', 'food', 'handyman', 'pet', 'tools', 'jobs'][i % 6],
		sellerId: `user${i + 1}`,
		status: ['available', 'sold'][i % 2],
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	parks: Array.from({ length: 10 }, (_, i) => ({
		name: `Sample Park ${i + 1}`,
		description: `This is a sample park description for park ${i + 1}.`,
		location: `Area ${i + 1}`,
		size: `${10 + i} acres`,
		amenities: ['playground', 'picnic area', 'trails'][i % 3],
		isOpen: true,
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	reports: Array.from({ length: 10 }, (_, i) => ({
		title: `Sample Report ${i + 1}`,
		description: `This is a sample report description for report ${i + 1}.`,
		email: `user${i + 1}@example.com`,
		category: ['pothole', 'streetlight', 'garbage', 'noise', 'safety'][i % 5],
		location: `Block ${String.fromCharCode(65 + (i % 5))}, SS2/24`,
		type: ['incident', 'maintenance', 'feedback'][i % 3],
		status: ['pending', 'submitted', 'approved', 'rejected'][i % 4],
		reporterId: `user${i + 1}`,
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	shops: Array.from({ length: 10 }, (_, i) => ({
		name: `Sample Shop ${i + 1}`,
		description: `This is a sample shop description for shop ${i + 1}.`,
		type: ['food', 'retail', 'service'][i % 3],
		location: `Unit ${100 + i}`,
		isOpen: true,
		rating: Math.floor(Math.random() * 5) + 1,
		createdAt: new Date(),
		updatedAt: new Date()
	})),
	incidents: [
		{
			title: 'Pothole on Jalan SS2/24',
			description: 'Large pothole near the bus stop causing traffic to swerve. Approximately 60cm wide and 15cm deep.',
			type: 'pothole',
			severity: 'high',
			lat: 3.1145,
			lng: 101.6213,
			reports: 12,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Flash Flood at Lorong 21/12',
			description: 'Heavy rainfall caused flash flood about 30cm deep. Cars struggling to pass through.',
			type: 'flood',
			severity: 'high',
			lat: 3.1089,
			lng: 101.6156,
			reports: 25,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Streetlight Out — Taman SS3',
			description: 'Streetlight at the corner of Jalan SS3/29 has been out for 3 days. Very dark at night, safety concern.',
			type: 'streetlight',
			severity: 'medium',
			lat: 3.1023,
			lng: 101.6198,
			reports: 5,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Suspicious Activity Near Playground',
			description: 'Two individuals seen attempting to break into parked motorcycles near the SS4 playground around 2am.',
			type: 'crime',
			severity: 'high',
			lat: 3.1067,
			lng: 101.6089,
			reports: 3,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Traffic Jam — School Zone',
			description: 'Heavy congestion near SJK(C) school during pickup hours. Suggest traffic warden deployment.',
			type: 'traffic',
			severity: 'medium',
			lat: 3.1201,
			lng: 101.6245,
			reports: 18,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Multiple Potholes on Jalan 22/13',
			description: 'Stretch of road has 4-5 potholes forming a hazard for motorcyclists.',
			type: 'pothole',
			severity: 'medium',
			lat: 3.1156,
			lng: 101.6178,
			reports: 9,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Drain Blockage Causing Flood',
			description: 'Drain at Jalan 21/9 is blocked causing water to accumulate whenever it rains.',
			type: 'flood',
			severity: 'medium',
			lat: 3.1123,
			lng: 101.6134,
			reports: 7,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Broken Streetlight Pole',
			description: 'Streetlight pole appears to be leaning after recent storm. Safety hazard for pedestrians.',
			type: 'streetlight',
			severity: 'high',
			lat: 3.1189,
			lng: 101.6267,
			reports: 4,
			status: 'active',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Parked Car Blocking Driveway',
			description: 'Unknown vehicle has been parked blocking residential driveway for 2 days.',
			type: 'traffic',
			severity: 'low',
			lat: 3.1045,
			lng: 101.6212,
			reports: 2,
			status: 'resolved',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			title: 'Vandalism at Bus Stop',
			description: 'Bus stop glass panel was broken overnight. Glass shards on the ground.',
			type: 'crime',
			severity: 'low',
			lat: 3.1078,
			lng: 101.6145,
			reports: 1,
			status: 'resolved',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	],
	lostFound: [
		{
			status: 'lost',
			category: 'pet',
			title: 'Lost Golden Retriever — Biscuit',
			description: 'Male golden retriever, 3 years old, wearing blue collar with name tag. Last seen near SS2 park on Sunday evening. Very friendly, answers to \'Biscuit\'. Reward offered to anyone who can safely return him. Please do not chase if you spot him as he may run — try calling his name gently. Last seen around 7pm near the playground area.',
			location: 'SS2 Park, PJ',
			date: '2 days ago',
			contact: '012-3344-5566',
			image: 'https://placehold.co/600x400.png?text=Lost+Golden+Retriever',
			resolved: false,
			verified: false,
			createdAt: new Date()
		},
		{
			status: 'found',
			category: 'pet',
			title: 'Found Tabby Cat — No Collar',
			description: 'Found a female tabby cat near the taman\'s basketball court. Orange and white stripes. Looks well-fed and domesticated — clearly someone\'s pet. Currently safe with me in a spare room. She is calm and eating well. If this is your cat, please describe a distinguishing feature to confirm ownership before I return her.',
			location: 'Taman SS4, PJ',
			date: 'Yesterday',
			contact: '016-7788-9900',
			image: 'https://placehold.co/600x400.png?text=Found+Tabby+Cat',
			resolved: false,
			verified: true,
			createdAt: new Date()
		},
		{
			status: 'lost',
			category: 'phone',
			title: 'Lost iPhone 14 Pro (Black)',
			description: 'Black iPhone 14 Pro with cracked screen protector. Has a distinctive NASA sticker on the back cover. Lost during the pasar malam on Friday night around 9–10pm. The phone contains irreplaceable photos and important work files. No reward needed — just please return it. It was last seen near the kuih stall at the entrance end.',
			location: 'Pasar Malam SS3',
			date: '3 days ago',
			contact: '011-5544-3322',
			image: 'https://placehold.co/600x400.png?text=Lost+iPhone+14+Pro',
			resolved: false,
			verified: false,
			createdAt: new Date()
		},
		{
			status: 'found',
			category: 'wallet',
			title: 'Found Brown Leather Wallet',
			description: 'Found a brown leather bifold wallet near the mamak restaurant at Jalan 21/11. Contains an IC, two bank cards (Maybank and CIMB), and a gym membership card. No cash was inside when found. Wallet is currently kept safe at my home. To claim, please describe the contents in detail — I will verify before returning.',
			location: 'Jalan 21/11, SS2',
			date: 'Today',
			contact: '013-2211-4433',
			image: 'https://placehold.co/600x400.png?text=Found+Brown+Leather+Wallet',
			resolved: false,
			verified: true,
			createdAt: new Date()
		},
		{
			status: 'lost',
			category: 'keys',
			title: 'Lost Car Keys (Perodua Myvi)',
			description: 'Perodua Myvi key fob (silver, 2019 model). Has a small red keychain and a gym membership card attached to the ring. The keys were last seen when I was at the carpark, and I cannot find them after walking through to Giant supermarket. Without these keys I cannot drive — please contact if found, even a small finder\'s fee is available.',
			location: 'Giant SS2 area',
			date: '4 hours ago',
			contact: '017-8899-0011',
			image: 'https://placehold.co/600x400.png?text=Lost+Car+Keys',
			resolved: false,
			verified: false,
			createdAt: new Date()
		},
		{
			status: 'lost',
			category: 'pet',
			title: 'Missing Persian Cat — Snowball',
			description: 'White Persian cat, female, 2 years old, approximately 4kg. Very timid around strangers — she will hide if approached. Wearing a pink collar with a small bell. Missing from our compound since Monday morning. She has never been outside before and we are very worried. If spotted, please do not grab her — call us and we will come.',
			location: 'Lorong SS7/2',
			date: '4 days ago',
			contact: '019-6677-8899',
			image: 'https://placehold.co/600x400.png?text=Missing+Persian+Cat',
			resolved: false,
			verified: false,
			createdAt: new Date()
		},
		{
			status: 'found',
			category: 'phone',
			title: 'Found Samsung Phone at Playground',
			description: 'Found a Samsung Galaxy smartphone (model unclear — screen is cracked) near the children\'s playground at the taman park. The phone was face-down near the benches around 6pm. I have handed it to the taman security guard at the guard post near the main entrance. Bring your IC to claim it. They will need to verify your identity.',
			location: 'Taman SS5 Playground',
			date: '2 days ago',
			contact: 'Contact guard post',
			image: 'https://placehold.co/600x400.png?text=Found+Samsung+Phone',
			resolved: false,
			verified: true,
			createdAt: new Date()
		},
		{
			status: 'lost',
			category: 'bag',
			title: 'Lost Black Backpack (MacBook inside!)',
			description: 'Black Adidas backpack (medium size) left at the mamak table. Contents include: a 14-inch MacBook Pro (Space Grey), MagSafe charger, glasses case (black frame), a blue water bottle, and some work documents. This is extremely urgent — the MacBook has unsaved work. Finder\'s reward: RM 200, no questions asked. Please WhatsApp immediately.',
			location: 'Mamak SS2/75',
			date: 'Yesterday',
			contact: '012-9988-7766',
			image: 'https://placehold.co/600x400.png?text=Lost+Black+Backpack',
			resolved: false,
			verified: false,
			createdAt: new Date()
		},
		{
			status: 'found',
			category: 'keys',
			title: 'Found Keys — 3 keys + keychain',
			description: 'Found a set of 3 keys with a distinctive Kedah state keyfob hanging near the wet market entrance on Wednesday morning. The keys look like they belong to a house or apartment (not a car key). I have handed them to the wet market supervisor (Mr. Rajan) for safe keeping. Go to the supervisor\'s counter and describe the keys to claim them.',
			location: 'Pasar Basah SS2',
			date: '3 days ago',
			contact: 'Ask market supervisor',
			image: 'https://placehold.co/600x400.png?text=Found+Keys+3+keys+keychain',
			resolved: true,
			verified: true,
			createdAt: new Date()
		},
		{
			status: 'lost',
			category: 'document',
			title: 'Lost IC and Driving Licence',
			description: 'Lost my wallet containing: MyKad (IC), driving licence (P), and a public library card. The wallet itself is a slim dark blue cardholder. Lost somewhere around the SS3 area on Saturday afternoon. The IC is very urgent to replace and the process takes time. If found, please contact — I will come to you immediately. A reward of RM 50 is offered.',
			location: 'Around SS3 area',
			date: '5 days ago',
			contact: '016-4433-2211',
			image: 'https://placehold.co/600x400.png?text=Lost+IC+and+Driving+Licence',
			resolved: false,
			verified: false,
			createdAt: new Date()
		}
	]
};

async function main() {
	let client;
	try {
		console.log('Connecting to MongoDB...');
		client = await clientConnect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jiran-tetangga');
		const db = client.db(process.env.MONGODB_DBNAME || 'data');
		console.log('Connected to MongoDB');

		for (const [collectionName, documents] of Object.entries(sampleData)) {
			const collection = db.collection(collectionName);
			if (collectionName === 'adminUsers') {
				// Clear the collection first (using the actual collection name 'adminUsers')
				console.log('Clearing existing data in adminUsers...');
				await db.collection('adminUsers').deleteMany({});
				// Then create each admin user via API (to ensure password encryption)
				console.log(`Creating ${documents.length} admin user(s) via API...`);
				for (const userDoc of documents) {
					try {
						const result = await postToApi('/adminUsers', userDoc);
						if (!result) console.error(`Failed to create admin user ${userDoc.email}`);
						console.log(`Created admin user: ${userDoc.email}`);
					} catch (error) {
						console.error(`Failed to create admin user ${userDoc.email}:`, error.message);
					}
				}
			} else {
				// For other collections, clear and insertMany directly
				console.log(`Clearing existing data in ${collectionName}...`);
				await collection.deleteMany({});
				console.log(`Inserting ${documents.length} sample documents into ${collectionName}...`);
				const result = await collection.insertMany(documents);
				console.log(`Inserted ${result.insertedCount} documents into ${collectionName}`);
			}
		}

		console.log('Sample data population completed!');
	} catch (error) {
		console.error('Failed to populate sample data:', error);
		process.exit(1);
	} finally {
		if (client) {
			await client.close();
			console.log('MongoDB connection closed');
		}
	}
}

main();
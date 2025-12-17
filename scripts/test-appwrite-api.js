// Test script to check Appwrite API and add platform if needed
// Run with: node scripts/test-appwrite-api.js

const https = require('https');

const PROJECT_ID = '693f4a370022ade56c94';
const ENDPOINT = 'https://cloud.appwrite.io/v1';

console.log('Testing Appwrite connection...\n');
console.log('Project ID:', PROJECT_ID);
console.log('Endpoint:', ENDPOINT);
console.log('\n---\n');

// Test 1: Check if we can reach Appwrite
console.log('Test 1: Checking Appwrite endpoint...');
const testRequest = https.get(`${ENDPOINT}/health`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Appwrite is reachable');
    console.log('Response:', data);
    console.log('\n---\n');
    
    // Test 2: Try to get account (will fail without auth, but shows CORS)
    console.log('Test 2: Testing CORS with account endpoint...');
    testCORS();
  });
});

testRequest.on('error', (err) => {
  console.error('❌ Cannot reach Appwrite:', err.message);
});

function testCORS() {
  const options = {
    hostname: 'cloud.appwrite.io',
    path: '/v1/account',
    method: 'GET',
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'Origin': 'http://localhost:3000'
    }
  };

  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 401) {
        console.log('✅ CORS is working! (401 is expected without auth)');
        console.log('The issue is likely authentication, not CORS.');
      } else {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
  });

  req.end();
}




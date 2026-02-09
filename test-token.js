import axios from 'axios';

const token = 'eyJhbGciOiJSUzI1NiIsImlzcyI6Imh0dHBzOi8vYXV0aC10b2tlbi5kZXZyZXYuYWkvIiwia2lkIjoic3RzX2tpZF9yc2EiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOlsiamFudXMiXSwiYXpwIjoiZG9uOmlkZW50aXR5OmR2cnYtdXMtMTpkZXZvLzFISEgzcjFrajpkZXZ1LzczIiwiZXhwIjoxODY1MTU4MzYxLCJodHRwOi8vZGV2cmV2LmFpL2F1dGgwX3VpZCI6ImRvbjppZGVudGl0eTpkdnJ2LXVzLTE6ZGV2by9zdXBlcjphdXRoMF91c2VyL3NhbWxwfHJvY2tldGl1bXxtZWdoYS5rdW1hcmlAcm9ja2V0aXVtLmNvbSIsImh0dHA6Ly9kZXZyZXYuYWkvYXV0aDBfdXNlcl9pZCI6InNhbWxwfHJvY2tldGl1bXxtZWdoYS5rdW1hcmlAcm9ja2V0aXVtLmNvbSIsImh0dHA6Ly9kZXZyZXYuYWkvZGV2b19kb24iOiJkb246aWRlbnRpdHk6ZHZydi11cy0xOmRldm8vMUhISDNyMWtqIiwiaHR0cDovL2RldnJldi5haS9kZXZvaWQiOiJERVYtMUhISDNyMWtqIiwiaHR0cDovL2RldnJldi5haS9kZXZ1aWQiOiJERVZVLTczIiwiaHR0cDovL2RldnJldi5haS9kaXNwbGF5bmFtZSI6Ik1lZ2hhIiwiaHR0cDovL2RldnJldi5haS9lbWFpbCI6Im1lZ2hhLmt1bWFyaUByb2NrZXRpdW0uY29tIiwiaHR0cDovL2RldnJldi5haS9mdWxsbmFtZSI6Ik1lZ2hhIEt1bWFyaSIsImh0dHA6Ly9kZXZyZXYuYWkvaXNfdmVyaWZpZWQiOnRydWUsImh0dHA6Ly9kZXZyZXYuYWkvdG9rZW50eXBlIjoidXJuOmRldnJldjpwYXJhbXM6b2F1dGg6dG9rZW4tdHlwZTpwYXQiLCJpYXQiOjE3NzA2MzY3NjEsImlzcyI6Imh0dHBzOi8vYXV0aC10b2tlbi5kZXZyZXYuYWkvIiwianRpIjoiZG9uOmlkZW50aXR5OmR2cnYtdXMtMTpkZXZvLzFISEgzcjFrajp0b2tlbi9LRXJoYjRZNCIsIm9yZ19pZCI6Im9yZ19zZE9Bdmg4UXVqOE9XcVQzIiwic3ViIjoiZG9uOmlkZW50aXR5OmR2cnYtdXMtMTpkZXZvLzFISEgzcjFrajpkZXZ1LzczIn0.siBRH6Wk1gyDHfMsJpKZj3NRxuVsKSJwFe8Zkk4leM3NRPuWcjpkpciHv84_S8CRY0lCXX55JVbh0V0TzGWrl8JaeeXjLLk04Sc8mcsFqlTAzQmdU0AQvgJMZL5WPDeXTrkmxu9YOQklI4V3tc2c2ZBwhBcs0PqMLFyFPV7JTb6y12uj0R8uWShR-HRYdgVPPpxs4rtkKIWe_veeRzZVi8yQvWsXhC0OZQ9tg-Ig-djHUubg8JboLu4JWwOzn5p9e7mLvXmQqJfePv0h2WGmDVQTCHaUTQg5Hbgpgkb1scnv820xzrsrZ9avNdN0d7poModcqGWyjZyfWzMoDOM2LQ';

async function testToken() {
  try {
    console.log('Testing DevRev API with new token...\n');

    const response = await axios.post(
      'https://api.devrev.ai/mcp/v1/works.list',
      { limit: 5 },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Token is VALID!');
    console.log(`Fetched ${response.data.works?.length || 0} works`);
    console.log('\nResponse:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Token FAILED');
    console.log(`Error: ${error.response?.status} ${error.response?.statusText}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    console.log('\nFull error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testToken();

import fetch from 'node-fetch';

const TOKEN = 'vca_2NGDeRarb709OJg6OF1OviUBLj3paWd8f154czSVQ6dNz3QBzF2ZP6sg';
const USER_ID = 'zxrZy0631mhXytI7fgreDEj0';

async function main() {
  console.log('Fetching projects with teamId=userId...');
  const res = await fetch(`https://api.vercel.com/v9/projects?teamId=${USER_ID}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  console.log('Projects:', JSON.stringify(data, null, 2));
}

main().catch(console.error);

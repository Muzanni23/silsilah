import path from 'path';

// Override TTY properties
Object.defineProperty(process.stdout, 'isTTY', { value: true });
Object.defineProperty(process.stdin, 'isTTY', { value: true });
Object.defineProperty(process.stderr, 'isTTY', { value: true });

// Setup arguments
process.argv = [
  process.argv[0],
  path.resolve('./node_modules/vercel/dist/vc.js'),
  'link'
];

console.log('Running Vercel Link with simulated TTY...');

// Dynamically import Vercel CLI
import('../node_modules/vercel/dist/vc.js').catch(err => {
  console.error('Failed to run Vercel CLI:', err);
});

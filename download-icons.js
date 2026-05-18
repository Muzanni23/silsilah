const fs = require('fs');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  await download('https://via.placeholder.com/192x192.png/d4a853/ffffff?text=BAM', 'public/icons/icon-192x192.png');
  await download('https://via.placeholder.com/512x512.png/d4a853/ffffff?text=BAM', 'public/icons/icon-512x512.png');
  console.log('Icons downloaded');
}

main();

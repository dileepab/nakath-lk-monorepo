const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./apps/web');

const targets = [
  '@/lib/profile',
  '@/lib/profile-fixtures',
  '@/lib/porondam',
  '@/lib/horoscope-rules',
  '@/lib/horoscope-config',
  '@/lib/astrology-time'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  targets.forEach(target => {
    const regex = new RegExp(`['"]${target}['"]`, 'g');
    if (regex.test(content)) {
        content = content.replace(regex, '"@acme/core"');
        changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});

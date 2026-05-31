const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matches = [];
      
      lines.forEach((line, idx) => {
        // Match a literal $ that is not followed by {
        const regex = /\$(?!\{)/g;
        if (regex.test(line)) {
          matches.push(`${idx + 1}: ${line.trim()}`);
        }
      });
      
      if (matches.length > 0) {
        console.log(`\nFILE: ${filePath}`);
        matches.forEach(m => console.log(`  ${m}`));
      }
    }
  });
}

walk(path.join(__dirname, 'src'));

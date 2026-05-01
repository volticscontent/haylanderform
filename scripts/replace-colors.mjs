import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceColors() {
  const dir = path.join(process.cwd(), 'src/app/(admin)/serpro');
  
  walkDir(dir, function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Substituir dark mode (blue/indigo -> orange)
    content = content.replace(/(dark:[a-z]+-)(blue|indigo)(-[0-9]+(?:\/[0-9]+)?)/g, '$1orange$3');
    
    // Substituir light mode (blue/indigo -> purple)
    content = content.replace(/([a-z]+-)(blue|indigo)(-[0-9]+(?:\/[0-9]+)?)/g, (match, p1, p2, p3) => {
        // Se já tiver "dark:" no p1, ignora porque foi tratado na regex acima, mas na verdade a regex só pega [a-z]+-
        // Exemplo: text-blue-500 -> p1=text-, p2=blue, p3=-500
        // Se for dark:text-blue-500, a primeira regex já pegou e transformou em dark:text-orange-500
        // Então aqui vai pegar text-orange-500? Não, a regex procura blue|indigo.
        return p1 + 'purple' + p3;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  });
}

replaceColors();

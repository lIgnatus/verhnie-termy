// Сборка: один файл app.js, шрифты внутри страницы, ассеты рядом.
// Запуск: node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });

await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'none',
  outfile: path.join(dist, 'app.js'),
  loader: { '.json': 'json' },
  logLevel: 'warning',
});

for (const f of fs.readdirSync(path.join(root, 'public/assets'))) {
  if (f === 'height.bin') fs.writeFileSync(path.join(dist, 'assets/height.txt'), fs.readFileSync(path.join(root, 'public/assets', f)).toString('base64'));
  else fs.copyFileSync(path.join(root, 'public/assets', f), path.join(dist, 'assets', f));
}

// Шрифты встраиваем, чтобы страница не зависела от внешних серверов
const fontDir = path.join(root, 'data/fonts');
let fonts = '';
if (fs.existsSync(path.join(fontDir, 'fonts.css'))) {
  fonts = fs.readFileSync(path.join(fontDir, 'fonts.css'), 'utf8').replace(/url\(([^)]+)\)/g, (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir, f.replace(/['"]/g, ''))).toString('base64')})`);
}
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8').replace('/*FONTS*/', fonts);
fs.writeFileSync(path.join(dist, 'index.html'), html);
// Прототип не нужен поисковикам
fs.writeFileSync(path.join(dist, 'robots.txt'), ['User-agent: *', 'Disallow: /', ''].join('\n'));

const kb = (f) => (fs.statSync(path.join(dist, f)).size / 1024).toFixed(0) + ' КБ';
console.log('index.html', kb('index.html'), 'app.js', kb('app.js'));

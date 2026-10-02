import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '../docs/images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Launching Chrome headless with remote debugging...');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--window-size=1080,680',
  'http://localhost:5173'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page');

  if (!pageTarget) {
    throw new Error('No page target found');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      cb(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    return await sendCommand('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  }

  async function capture(fileName) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, buffer);
    console.log(`Captured: ${fileName} (${buffer.length} bytes)`);
  }

  await sendCommand('Page.enable');
  await new Promise(r => setTimeout(r, 1500));

  // 1. Starter selection print
  await capture('01_starter_select.png');

  // 2. Select Charmander!
  console.log('Selecting Starter (Charmander)...');
  await evaluate(`
    const el = document.querySelector('[data-starter="charmander"]');
    if (el) el.click();
  `);

  console.log('Waiting for Phaser battle arena to initialize & bump combat...');
  await new Promise(r => setTimeout(r, 4500));

  // 2. Battle Screen with Pokemon GO HUD
  await capture('02_battle_arena.png');

  // 3. Open Radial Pokéball Menu
  console.log('Opening Radial Pokéball Menu...');
  await evaluate(`
    const menuBtn = document.getElementById('btn-pokeball-menu');
    if (menuBtn) menuBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('03_radial_menu.png');

  // 4. Open Diário de Batalha (from radial menu)
  console.log('Opening Diário de Batalha...');
  await evaluate(`
    const logBtn = document.getElementById('pogo-btn-log');
    if (logBtn) logBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('04_battle_diary.png');

  // 5. Open Equipe
  console.log('Opening Equipe...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const buddyBtn = document.getElementById('btn-open-team');
    if (buddyBtn) buddyBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('05_team_modal.png');

  // 6. Open Mochila
  console.log('Opening Mochila...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const menuBtn = document.getElementById('btn-pokeball-menu');
    if (menuBtn) menuBtn.click();
  `);
  await new Promise(r => setTimeout(r, 400));
  await evaluate(`
    const bagBtn = document.getElementById('pogo-btn-bag');
    if (bagBtn) bagBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('06_bag_modal.png');

  // 7. Open Rotas & Hunts
  console.log('Opening Rotas & Hunts...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const routesBtn = document.getElementById('btn-open-routes');
    if (routesBtn) routesBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('07_routes_modal.png');

  // 8. Open Loja (Poké Mart)
  console.log('Opening Loja...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const shopBtn = document.getElementById('btn-top-shop');
    if (shopBtn) shopBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('08_shop_modal.png');

  // 9. Open Pokédex Art Model Modal (Behance / Stort Design Gráfico)
  console.log('Opening Pokédex UI Art Model...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const menuBtn = document.getElementById('btn-pokeball-menu');
    if (menuBtn) menuBtn.click();
  `);
  await new Promise(r => setTimeout(r, 400));
  await evaluate(`
    const pkmBtn = document.getElementById('pogo-btn-pokedex');
    if (pkmBtn) pkmBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1500));
  await capture('10_pokedex_art_model.png');

  // 10. Open Mercado de Treinadores (P2P)
  console.log('Opening Mercado P2P...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const mktBtn = document.getElementById('btn-top-market');
    if (mktBtn) mktBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await capture('11_p2p_market.png');

  // 11. Open Perfil & Nuvem SQLite
  console.log('Opening Perfil / Auth SQLite...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const authBtn = document.getElementById('btn-top-auth');
    if (authBtn) authBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('12_auth_profile.png');

  // 12. Mobile Viewport Simulation
  console.log('Simulating Mobile Layout...');
  await evaluate(`
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  `);
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 820,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1200));
  await capture('09_mobile_view.png');

  console.log('All screenshots captured successfully!');
  ws.close();
} catch (err) {
  console.error('Error during capture:', err);
} finally {
  chrome.kill();
  process.exit(0);
}

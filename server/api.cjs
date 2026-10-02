const { db } = require('./db.cjs');

// Helper to parse JSON request bodies in pure node/connect middleware
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// Main API Handler
async function handleApiRequest(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/^\/api/, '');

  try {
    // 1. AUTH: Register
    if (pathname === '/auth/register' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { username, password, trainer_name } = body;

      if (!username || !password) {
        sendJson(res, 400, { error: 'Usuário e senha são obrigatórios.' });
        return true;
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const displayName = String(trainer_name || username).trim();

      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
      if (existing) {
        sendJson(res, 409, { error: 'Nome de usuário já está em uso.' });
        return true;
      }

      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, trainer_name, avatar, coins)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(cleanUsername, password, displayName, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/red.png', 1000);

      const newUser = db.prepare('SELECT id, username, trainer_name, avatar, coins, created_at FROM users WHERE username = ?').get(cleanUsername);
      sendJson(res, 201, {
        success: true,
        user: newUser,
        token: `mock_jwt_${newUser.id}_${Date.now()}`,
      });
      return true;
    }

    // 2. AUTH: Login
    if (pathname === '/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { username, password } = body;

      if (!username || !password) {
        sendJson(res, 400, { error: 'Usuário e senha são obrigatórios.' });
        return true;
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

      if (!user || user.password_hash !== password) {
        sendJson(res, 401, { error: 'Usuário ou senha inválidos.' });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          trainer_name: user.trainer_name,
          avatar: user.avatar,
          coins: user.coins,
          created_at: user.created_at,
        },
        token: `mock_jwt_${user.id}_${Date.now()}`,
      });
      return true;
    }

    // 3. AUTH: Me
    if (pathname.startsWith('/auth/me') && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        sendJson(res, 400, { error: 'User ID é obrigatório.' });
        return true;
      }

      const user = db.prepare('SELECT id, username, trainer_name, avatar, coins, created_at FROM users WHERE id = ?').get(Number(userId));
      if (!user) {
        sendJson(res, 404, { error: 'Treinador não encontrado.' });
        return true;
      }

      sendJson(res, 200, { success: true, user });
      return true;
    }

    // 4. SAVE: Cloud Save
    if (pathname === '/save' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { user_id, saveData } = body;

      if (!user_id || !saveData) {
        sendJson(res, 400, { error: 'user_id e saveData são obrigatórios.' });
        return true;
      }

      const saveDataString = JSON.stringify(saveData);

      // Upsert save
      const existingSave = db.prepare('SELECT user_id FROM user_saves WHERE user_id = ?').get(Number(user_id));
      if (existingSave) {
        db.prepare('UPDATE user_saves SET save_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
          .run(saveDataString, Number(user_id));
      } else {
        db.prepare('INSERT INTO user_saves (user_id, save_data) VALUES (?, ?)')
          .run(Number(user_id), saveDataString);
      }

      // Sync money in user profile
      if (saveData.money !== undefined) {
        db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(Number(saveData.money), Number(user_id));
      }

      sendJson(res, 200, { success: true, savedAt: new Date().toISOString() });
      return true;
    }

    // 5. SAVE: Cloud Load
    if (pathname.startsWith('/save/') && req.method === 'GET') {
      const parts = pathname.split('/');
      const userId = Number(parts[2]);

      if (!userId) {
        sendJson(res, 400, { error: 'ID de usuário inválido.' });
        return true;
      }

      const row = db.prepare('SELECT save_data, updated_at FROM user_saves WHERE user_id = ?').get(userId);
      if (!row) {
        sendJson(res, 404, { error: 'Nenhum save na nuvem encontrado para este treinador.' });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        saveData: JSON.parse(row.save_data),
        updatedAt: row.updated_at,
      });
      return true;
    }

    // 6. MARKET: Active Listings
    if (pathname === '/market/listings' && req.method === 'GET') {
      const type = url.searchParams.get('type') || 'all'; // all, pokemon, item
      const query = (url.searchParams.get('query') || '').trim().toLowerCase();
      const sortBy = url.searchParams.get('sortBy') || 'recent'; // recent, price_asc, price_desc, level_desc

      let sql = "SELECT * FROM market_listings WHERE status = 'active'";
      const params = [];

      if (type === 'pokemon' || type === 'item') {
        sql += ' AND item_type = ?';
        params.push(type);
      }

      if (query) {
        sql += ' AND (LOWER(item_name) LIKE ? OR LOWER(seller_name) LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      if (sortBy === 'price_asc') {
        sql += ' ORDER BY price ASC';
      } else if (sortBy === 'price_desc') {
        sql += ' ORDER BY price DESC';
      } else if (sortBy === 'level_desc') {
        sql += ' ORDER BY level DESC, price ASC';
      } else {
        sql += ' ORDER BY id DESC';
      }

      const rows = db.prepare(sql).all(...params);

      // Parse JSON item_data for Pokemon listings
      const formatted = rows.map(r => ({
        ...r,
        item_data: r.item_data ? JSON.parse(r.item_data) : null,
      }));

      sendJson(res, 200, { success: true, listings: formatted });
      return true;
    }

    // 7. MARKET: Create Listing (Anunciar Pokémon ou Item)
    if (pathname === '/market/create' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const {
        seller_id,
        seller_name,
        item_type,
        item_id,
        item_name,
        item_data,
        level = 1,
        quantity = 1,
        price,
      } = body;

      if (!seller_id || !seller_name || !item_type || !item_name || !price) {
        sendJson(res, 400, { error: 'Campos incompletos para anunciar no mercado.' });
        return true;
      }

      if (price < 1) {
        sendJson(res, 400, { error: 'O preço mínimo é de ₽ 1 Pokécoin.' });
        return true;
      }

      const stmt = db.prepare(`
        INSERT INTO market_listings (seller_id, seller_name, item_type, item_id, item_name, item_data, level, quantity, price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `);

      stmt.run(
        Number(seller_id),
        String(seller_name),
        item_type,
        String(item_id),
        String(item_name),
        item_data ? JSON.stringify(item_data) : null,
        Number(level) || 1,
        Number(quantity) || 1,
        Number(price)
      );

      const listing = db.prepare("SELECT * FROM market_listings WHERE seller_id = ? ORDER BY id DESC LIMIT 1").get(Number(seller_id));

      sendJson(res, 201, {
        success: true,
        message: 'Anúncio publicado com sucesso no Mercado de Treinadores!',
        listing: {
          ...listing,
          item_data: listing.item_data ? JSON.parse(listing.item_data) : null,
        },
      });
      return true;
    }

    // 8. MARKET: Buy Listing (Comprar de outro jogador)
    if (pathname === '/market/buy' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { listing_id, buyer_id } = body;

      if (!listing_id || !buyer_id) {
        sendJson(res, 400, { error: 'listing_id e buyer_id são obrigatórios.' });
        return true;
      }

      // Fetch listing
      const listing = db.prepare("SELECT * FROM market_listings WHERE id = ? AND status = 'active'").get(Number(listing_id));
      if (!listing) {
        sendJson(res, 404, { error: 'Este anúncio já foi vendido ou cancelado.' });
        return true;
      }

      if (listing.seller_id === Number(buyer_id)) {
        sendJson(res, 400, { error: 'Você não pode comprar seu próprio anúncio.' });
        return true;
      }

      // Fetch buyer
      const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(buyer_id));
      if (!buyer) {
        sendJson(res, 404, { error: 'Comprador não encontrado.' });
        return true;
      }

      if (buyer.coins < listing.price) {
        sendJson(res, 400, { error: `Moedas insuficientes. Preço: ₽ ${listing.price}, você possui: ₽ ${buyer.coins}.` });
        return true;
      }

      // Execute transaction
      db.exec('BEGIN TRANSACTION;');
      try {
        // Deduct from buyer
        const newBuyerCoins = buyer.coins - listing.price;
        db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(newBuyerCoins, buyer.id);

        // Credit seller
        db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(listing.price, listing.seller_id);

        // Mark listing as sold
        db.prepare(`
          UPDATE market_listings
          SET status = 'sold', buyer_id = ?, buyer_name = ?, completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(buyer.id, buyer.trainer_name, listing.id);

        // Insert transaction record
        db.prepare(`
          INSERT INTO market_transactions (listing_id, buyer_id, buyer_name, seller_id, seller_name, item_type, item_name, level, quantity, price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          listing.id,
          buyer.id,
          buyer.trainer_name,
          listing.seller_id,
          listing.seller_name,
          listing.item_type,
          listing.item_name,
          listing.level,
          listing.quantity,
          listing.price
        );

        db.exec('COMMIT;');

        const purchasedItemData = listing.item_data ? JSON.parse(listing.item_data) : null;

        sendJson(res, 200, {
          success: true,
          message: `Você comprou ${listing.item_name} de ${listing.seller_name} por ₽ ${listing.price}!`,
          listing: {
            ...listing,
            item_data: purchasedItemData,
          },
          buyerCoins: newBuyerCoins,
        });
        return true;
      } catch (txErr) {
        db.exec('ROLLBACK;');
        throw txErr;
      }
    }

    // 9. MARKET: Cancel Listing
    if (pathname === '/market/cancel' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { listing_id, seller_id } = body;

      const listing = db.prepare("SELECT * FROM market_listings WHERE id = ? AND status = 'active'").get(Number(listing_id));
      if (!listing) {
        sendJson(res, 404, { error: 'Anúncio não encontrado ou já encerrado.' });
        return true;
      }

      if (listing.seller_id !== Number(seller_id)) {
        sendJson(res, 403, { error: 'Você só pode cancelar seus próprios anúncios.' });
        return true;
      }

      db.prepare("UPDATE market_listings SET status = 'cancelled' WHERE id = ?").run(listing.id);

      sendJson(res, 200, {
        success: true,
        message: 'Anúncio cancelado com sucesso. Item devolvido!',
        returnedItem: {
          ...listing,
          item_data: listing.item_data ? JSON.parse(listing.item_data) : null,
        },
      });
      return true;
    }

    // 10. MARKET: My Listings
    if (pathname.startsWith('/market/my-listings/') && req.method === 'GET') {
      const parts = pathname.split('/');
      const userId = Number(parts[3]);

      const rows = db.prepare('SELECT * FROM market_listings WHERE seller_id = ? ORDER BY id DESC').all(userId);
      const formatted = rows.map(r => ({
        ...r,
        item_data: r.item_data ? JSON.parse(r.item_data) : null,
      }));

      sendJson(res, 200, { success: true, listings: formatted });
      return true;
    }

    // 11. MARKET: Trade History
    if (pathname === '/market/history' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM market_transactions ORDER BY id DESC LIMIT 25').all();
      sendJson(res, 200, { success: true, history: rows });
      return true;
    }

    // 12. POKEMART: Seed items catalog
    if (pathname === '/shop/items' && req.method === 'GET') {
      const items = [
        { id: 'poke-ball', name: 'Pokébola', price: 200, category: 'ball', description: 'Dispositivo padrão para captura de Pokémon selvagens.' },
        { id: 'great-ball', name: 'Super Ball', price: 600, category: 'ball', description: 'Taxa de captura aumentada (1.5x) para Pokémon mais ágeis.' },
        { id: 'ultra-ball', name: 'Ultra Ball', price: 1200, category: 'ball', description: 'Alta performance de captura (2x) para Pokémon raros e fortes.' },
        { id: 'master-ball', name: 'Master Ball', price: 25000, category: 'ball', description: 'Captura garantida (100%) em qualquer criatura.' },
        { id: 'potion', name: 'Poção', price: 300, category: 'healing', description: 'Restaura 20 pontos de HP do Pokémon ativo.' },
        { id: 'super-potion', name: 'Super Poção', price: 700, category: 'healing', description: 'Restaura 50 pontos de HP do Pokémon ativo.' },
        { id: 'hyper-potion', name: 'Hiper Poção', price: 1500, category: 'healing', description: 'Restaura 120 pontos de HP durante a caçada.' },
        { id: 'max-potion', name: 'Poção Máxima', price: 2500, category: 'healing', description: 'Restaura 100% da vida máxima do Pokémon.' },
        { id: 'fire-stone', name: 'Pedra do Fogo', price: 2500, category: 'stone', description: 'Evolui certas espécies de Pokémon como Vulpix, Eevee e Growlithe.' },
        { id: 'water-stone', name: 'Pedra da Água', price: 2500, category: 'stone', description: 'Evolui certas espécies como Poliwhirl, Shellder e Eevee.' },
        { id: 'thunder-stone', name: 'Pedra do Trovão', price: 2500, category: 'stone', description: 'Evolui Pikachu para Raichu e Eevee para Jolteon.' },
        { id: 'leaf-stone', name: 'Pedra da Folha', price: 2500, category: 'stone', description: 'Evolui Gloom para Vileplume e Weepinbell para Victreebel.' },
        { id: 'moon-stone', name: 'Pedra da Lua', price: 3000, category: 'stone', description: 'Evolui Clefairy, Jigglypuff, Nidorina e Nidorino.' },
      ];
      sendJson(res, 200, { success: true, items });
      return true;
    }

    return false;
  } catch (error) {
    console.error('API Error:', error);
    sendJson(res, 500, { error: 'Erro interno no servidor.', details: error.message });
    return true;
  }
}

module.exports = {
  handleApiRequest,
};

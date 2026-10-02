const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Ensure database directory exists
const dbPath = path.resolve(__dirname, '../data/pokeidle.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for high performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      trainer_name TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'trainer-red',
      coins INTEGER NOT NULL DEFAULT 1000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_saves (
      user_id INTEGER PRIMARY KEY,
      save_data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      seller_name TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK(item_type IN ('pokemon', 'item')),
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_data TEXT,
      level INTEGER DEFAULT 1,
      quantity INTEGER NOT NULL DEFAULT 1,
      price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'sold', 'cancelled')),
      buyer_id INTEGER,
      buyer_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      buyer_name TEXT NOT NULL,
      seller_id INTEGER NOT NULL,
      seller_name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      quantity INTEGER NOT NULL DEFAULT 1,
      price INTEGER NOT NULL,
      transacted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Check if system trainers exist
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, trainer_name, avatar, coins)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Default system seed trainers
    insertUser.run('ash', 'ash123', 'Ash Ketchum', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/red.png', 5000);
    insertUser.run('red', 'red123', 'Treinador Red', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/red.png', 10000);
    insertUser.run('misty', 'misty123', 'Líder Misty', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/misty.png', 7500);
    insertUser.run('oak', 'oak123', 'Prof. Carvalho', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/oak.png', 20000);
    insertUser.run('blue', 'blue123', 'Rival Blue', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/blue.png', 8000);
  }

  // Seed market listings if empty
  const existingListings = db.prepare("SELECT COUNT(*) as count FROM market_listings WHERE status = 'active'").get();
  if (existingListings.count === 0) {
    const insertListing = db.prepare(`
      INSERT INTO market_listings (seller_id, seller_name, item_type, item_id, item_name, item_data, level, quantity, price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    // Sample Pokemon listings
    const samplePokemon = [
      {
        seller_id: 1,
        seller_name: 'Ash Ketchum',
        speciesId: 25,
        name: 'pikachu',
        displayName: 'Pikachu',
        types: ['electric'],
        level: 16,
        price: 650,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif',
      },
      {
        seller_id: 2,
        seller_name: 'Treinador Red',
        speciesId: 6,
        name: 'charizard',
        displayName: 'Charizard',
        types: ['fire', 'flying'],
        level: 36,
        price: 3500,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif',
      },
      {
        seller_id: 3,
        seller_name: 'Líder Misty',
        speciesId: 131,
        name: 'lapras',
        displayName: 'Lapras',
        types: ['water', 'ice'],
        level: 28,
        price: 2400,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/131.gif',
      },
      {
        seller_id: 4,
        seller_name: 'Prof. Carvalho',
        speciesId: 254,
        name: 'sceptile',
        displayName: 'Sceptile',
        types: ['grass'],
        level: 36,
        price: 3200,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/254.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/254.gif',
      },
      {
        seller_id: 5,
        seller_name: 'Rival Blue',
        speciesId: 94,
        name: 'gengar',
        displayName: 'Gengar',
        types: ['ghost', 'poison'],
        level: 35,
        price: 2900,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/94.gif',
      },
      {
        seller_id: 1,
        seller_name: 'Ash Ketchum',
        speciesId: 143,
        name: 'snorlax',
        displayName: 'Snorlax',
        types: ['normal'],
        level: 30,
        price: 2100,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/143.gif',
      },
      {
        seller_id: 2,
        seller_name: 'Treinador Red',
        speciesId: 149,
        name: 'dragonite',
        displayName: 'Dragonite',
        types: ['dragon', 'flying'],
        level: 55,
        price: 7500,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/149.gif',
      },
      {
        seller_id: 3,
        seller_name: 'Líder Misty',
        speciesId: 134,
        name: 'vaporeon',
        displayName: 'Vaporeon',
        types: ['water'],
        level: 25,
        price: 1800,
        artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png',
        spriteFront: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/134.gif',
      },
    ];

    for (const p of samplePokemon) {
      const activePokemonData = {
        uid: 'mkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        speciesId: p.speciesId,
        name: p.name,
        displayName: p.displayName,
        types: p.types,
        level: p.level,
        currentHp: 50 + p.level * 4,
        maxHp: 50 + p.level * 4,
        attack: 40 + p.level * 3,
        defense: 40 + p.level * 3,
        speed: 40 + p.level * 3,
        exp: 0,
        expToNextLevel: 1000,
        spriteFront: p.spriteFront,
        spriteBack: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${p.speciesId}.png`,
        artwork: p.artwork,
        evolutions: [],
      };

      insertListing.run(
        p.seller_id,
        p.seller_name,
        'pokemon',
        String(p.speciesId),
        p.displayName,
        JSON.stringify(activePokemonData),
        p.level,
        1,
        p.price
      );
    }

    // Sample Item listings
    const sampleItems = [
      { seller_id: 4, seller_name: 'Prof. Carvalho', item_id: 'ultra-ball', item_name: 'Ultra Ball', qty: 10, price: 450 },
      { seller_id: 3, seller_name: 'Líder Misty', item_id: 'water-stone', item_name: 'Pedra da Água', qty: 1, price: 1200 },
      { seller_id: 2, seller_name: 'Treinador Red', item_id: 'fire-stone', item_name: 'Pedra do Fogo', qty: 1, price: 1200 },
      { seller_id: 1, seller_name: 'Ash Ketchum', item_id: 'max-potion', item_name: 'Max Potion', qty: 5, price: 600 },
      { seller_id: 5, seller_name: 'Rival Blue', item_id: 'revive', item_name: 'Revive', qty: 8, price: 500 },
    ];

    for (const item of sampleItems) {
      insertListing.run(
        item.seller_id,
        item.seller_name,
        'item',
        item.item_id,
        item.item_name,
        null,
        1,
        item.qty,
        item.price
      );
    }
  }
}

initDatabase();

module.exports = {
  db,
};

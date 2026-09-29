import * as Phaser from 'phaser';
import './styles/style.css';
import { createGameConfig } from './game/config';
import { gameState } from './state/gameState';
import { battleEngine } from './state/battleEngine';
import { HUD } from './ui/HUD';
import { pokeApi } from './api/pokeApi';

async function initStarterSelection(): Promise<void> {
  return new Promise((resolve) => {
    const starterModal = document.createElement('div');
    starterModal.className = 'modal-overlay';
    starterModal.innerHTML = `
      <div class="modal-content" style="max-width: 520px; text-align: center;">
        <div class="modal-header" style="justify-content: center;">
          <div class="modal-title">⭐ Escolha seu Pokémon Inicial!</div>
        </div>
        <div class="modal-body">
          <p style="color: #94a3b8; margin-bottom: 20px;">
            Boas-vindas ao <strong>PokeIDLE</strong>! Escolha seu primeiro companheiro para iniciar sua jornada:
          </p>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div class="poke-card starter-option" data-starter="pikachu" style="cursor: pointer; text-align: center;">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif" style="width: 56px; height: 56px; margin: 0 auto;" />
              <div style="font-weight: 700; margin-top: 6px;">Pikachu</div>
              <span class="type-pill type-electric">Elétrico</span>
            </div>
            <div class="poke-card starter-option" data-starter="charmander" style="cursor: pointer; text-align: center;">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/4.gif" style="width: 56px; height: 56px; margin: 0 auto;" />
              <div style="font-weight: 700; margin-top: 6px;">Charmander</div>
              <span class="type-pill type-fire">Fogo</span>
            </div>
            <div class="poke-card starter-option" data-starter="squirtle" style="cursor: pointer; text-align: center;">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/7.gif" style="width: 56px; height: 56px; margin: 0 auto;" />
              <div style="font-weight: 700; margin-top: 6px;">Squirtle</div>
              <span class="type-pill type-water">Água</span>
            </div>
            <div class="poke-card starter-option" data-starter="bulbasaur" style="cursor: pointer; text-align: center;">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/1.gif" style="width: 56px; height: 56px; margin: 0 auto;" />
              <div style="font-weight: 700; margin-top: 6px;">Bulbasaur</div>
              <span class="type-pill type-grass">Planta</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(starterModal);

    starterModal.querySelectorAll('.starter-option').forEach(el => {
      el.addEventListener('click', async (e) => {
        const starterName = (e.currentTarget as HTMLElement).getAttribute('data-starter')!;
        starterModal.remove();
        await gameState.initStarter(starterName);
        resolve();
      });
    });
  });
}

async function startApp(): Promise<void> {
  // If player doesn't have any Pokemon yet, prompt starter choice
  if (gameState.party.length === 0) {
    await initStarterSelection();
  }

  // Preload starter data & current route to ensure everything is ready
  const active = gameState.activePokemon;
  if (active) {
    await pokeApi.getPokemon(active.speciesId);
  }

  // Initialize Phaser
  const config = createGameConfig('phaser-container');
  new Phaser.Game(config);

  // Initialize HUD with bottom container, ticker and top container
  new HUD('hud-container', 'status-ticker', 'hud-top');

  // Start Idle Battle Engine
  if (gameState.settings.autoHunt) {
    battleEngine.start();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  startApp();
});

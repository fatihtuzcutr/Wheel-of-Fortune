import './style.css';
import { Game } from './game.js';

function init() {
  if (!window.carkifelekGame && document.getElementById('sahne')) {
    window.carkifelekGame = new Game();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

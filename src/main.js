import './styles.css';
import './menu-fit.css';
import { GameApplication } from './app/GameApplication.js';

const game = new GameApplication(document.querySelector('#game'));
game.start();

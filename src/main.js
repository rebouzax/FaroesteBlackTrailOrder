import './styles.css';
import { GameApplication } from './app/GameApplication.js';

const game = new GameApplication(document.querySelector('#game'));
game.start();

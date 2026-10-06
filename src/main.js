import './styles.css';
import './menu-fit.css';
import './dark-frontier.css';
import './selection-carousel.css';
import './bento-shop.css';
import './journey-feedback.css';
import { GameApplication } from './app/GameApplication.js';

const game = new GameApplication(document.querySelector('#game'));
game.start();
if (import.meta.env.DEV && new URLSearchParams(location.search).has('preview')) {
  import('./dev/preview.js').then(({ preview }) => preview(game));
}

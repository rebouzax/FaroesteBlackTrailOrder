import { WorldModel } from '../models/WorldModel.js';
import { GameViewModel } from '../viewmodels/GameViewModel.js';
import { GameView } from '../views/GameView.js';

export class GameApplication {
  constructor(root) {
    this.model = new WorldModel();
    this.view = new GameView(root);
    this.viewModel = new GameViewModel(this.model, this.view);
  }

  start() {
    this.viewModel.connect();
  }
}

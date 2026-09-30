import { WorldModel } from '../models/WorldModel.js';
import { GameViewModel } from '../viewmodels/GameViewModel.js';
import { GameView } from '../views/GameView.js';
import { MenuModel } from '../models/MenuModel.js';
import { MenuViewModel } from '../viewmodels/MenuViewModel.js';

export class GameApplication {
  constructor(root) {
    this.model = new WorldModel();
    this.menuModel = new MenuModel();
    this.view = new GameView(root);
    this.viewModel = new GameViewModel(this.model, this.view, this.menuModel);
    this.menuViewModel = new MenuViewModel(this.menuModel, null, this.viewModel, root);
    this.view.menuViewModel = this.menuViewModel;
  }

  start() {
    this.viewModel.connect();
  }
}

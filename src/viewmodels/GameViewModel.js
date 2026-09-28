const WORLD_LIMIT = 108;
const PLAYER_RADIUS = 0.48;

export class GameViewModel {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.keys = new Set();
    this.colliders = [];
    this.speed = 6.2;
    this.onKeyDown = (event) => this.keys.add(event.code);
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onBlur = () => this.keys.clear();
    this.onResize = () => this.view.resize();
    this.onLock = () => this.model.setLocked(true);
    this.onUnlock = () => this.model.setLocked(false);
  }

  connect() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onResize);
    this.view.controls.addEventListener('lock', this.onLock);
    this.view.controls.addEventListener('unlock', this.onUnlock);
    this.view.mount(this);
  }

  addCollider(x, z, radius) {
    this.colliders.push({ x, z, radius });
  }

  start() {
    this.view.controls.lock();
  }

  update(delta) {
    this.model.updateTime(delta);
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const strafe = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const moving = forward !== 0 || strafe !== 0;

    if (moving && this.model.isLocked) {
      const length = Math.hypot(forward, strafe) || 1;
      const speed = this.speed * delta * (this.keys.has('ShiftLeft') ? 1.55 : 1);
      const yaw = this.view.controls.getObject().rotation.y;
      const dx = (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) / length * speed;
      const dz = (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) / length * speed;
      this.tryMove(dx, dz);
    }

    const camera = this.view.camera;
    this.model.updatePlayer({
      x: camera.position.x,
      z: camera.position.z,
      yaw: camera.rotation.y,
      pitch: camera.rotation.x,
      walking: moving && this.model.isLocked,
    });
    this.view.update(delta, this.model);
  }

  tryMove(dx, dz) {
    const camera = this.view.camera;
    const nextX = camera.position.x + dx;
    const nextZ = camera.position.z + dz;
    if (Math.hypot(nextX, nextZ) > WORLD_LIMIT) return;
    const collides = this.colliders.some(({ x, z, radius }) => Math.hypot(nextX - x, nextZ - z) < radius + PLAYER_RADIUS);
    if (!collides) camera.position.set(nextX, 1.68, nextZ);
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    this.view.controls.removeEventListener('lock', this.onLock);
    this.view.controls.removeEventListener('unlock', this.onUnlock);
    this.view.dispose();
  }
}

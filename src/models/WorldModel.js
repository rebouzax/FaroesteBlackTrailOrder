export class WorldModel {
  constructor() {
    this.stageName = 'Deserto dos Condenados';
    this.objective = 'Explore o deserto';
    this.elapsed = 0;
    this.player = { x: 0, z: 8, yaw: 0, pitch: 0 };
    this.isLocked = false;
    this.walking = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) listener(this);
  }

  updatePlayer({ x, z, yaw, pitch, walking }) {
    Object.assign(this.player, { x, z, yaw, pitch });
    this.walking = walking;
  }

  setLocked(isLocked) {
    this.isLocked = isLocked;
    this.notify();
  }

  updateTime(delta) {
    if (this.isLocked) this.elapsed += delta;
  }
}

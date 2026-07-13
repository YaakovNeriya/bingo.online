export const CONFIG = {
  MAX_CONCURRENT_PRELOADS: 3,
  MAX_CACHED_PLAYERS: 10,
  PRELOAD_SAFETY_TIMEOUT_MS: 5000, // 5 seconds
};

class WistiaPreloadManager {
  constructor() {
    this.container = null;
    this.activePreloads = new Set();
    this.cachedPlayers = new Map();
    this.queue = [];
    
    // Create a hidden container on the body if we are in browser
    if (typeof window !== 'undefined') {
      this.initContainer();
    }
  }

  initContainer() {
    this.container = document.createElement('div');
    this.container.id = 'wistia-preload-container';
    this.container.style.position = 'absolute';
    this.container.style.width = '1px';
    this.container.style.height = '1px';
    this.container.style.overflow = 'hidden';
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '-9999';
    document.body.appendChild(this.container);
  }

  preload(mediaId) {
    if (!mediaId || this.cachedPlayers.has(mediaId) || this.activePreloads.has(mediaId)) {
      return;
    }

    if (this.activePreloads.size >= CONFIG.MAX_CONCURRENT_PRELOADS) {
      if (!this.queue.includes(mediaId)) {
        this.queue.push(mediaId);
      }
      return;
    }

    this._startPreload(mediaId);
  }

  _startPreload(mediaId) {
    this.activePreloads.add(mediaId);
    
    // Manage cache size
    if (this.cachedPlayers.size >= CONFIG.MAX_CACHED_PLAYERS) {
      // Remove oldest (first key in Map)
      const oldestKey = this.cachedPlayers.keys().next().value;
      const oldPlayer = this.cachedPlayers.get(oldestKey);
      if (oldPlayer && oldPlayer.parentNode) {
        oldPlayer.parentNode.removeChild(oldPlayer);
      }
      this.cachedPlayers.delete(oldestKey);
    }

    const player = document.createElement('wistia-player');
    player.setAttribute('media-id', mediaId);
    player.setAttribute('preload', 'auto');
    // Ensure it's muted in the background just in case
    player.setAttribute('muted', 'true');
    // Hide controls during preload
    player.setAttribute('big-play-button', 'false');

    this.cachedPlayers.set(mediaId, player);
    
    let isFinished = false;

    const finishPreload = () => {
      if (isFinished) return;
      isFinished = true;
      this.activePreloads.delete(mediaId);
      this._processQueue();
    };

    // The new player fires 'can-play' event
    player.addEventListener('can-play', () => {
      finishPreload();
    }, { once: true });

    // Safety timeout in case event never fires
    setTimeout(() => {
      finishPreload();
    }, CONFIG.PRELOAD_SAFETY_TIMEOUT_MS);

    if (this.container) {
      this.container.appendChild(player);
    }
  }

  _processQueue() {
    if (this.queue.length > 0 && this.activePreloads.size < CONFIG.MAX_CONCURRENT_PRELOADS) {
      const nextMediaId = this.queue.shift();
      this._startPreload(nextMediaId);
    }
  }

  getPlayerFor(mediaId) {
    if (!mediaId) return null;
    const player = this.cachedPlayers.get(mediaId);
    if (player) {
      // Remove it from our cache because it's being "sucked out" to be used
      if (player.parentNode) {
        player.parentNode.removeChild(player);
      }
      this.cachedPlayers.delete(mediaId);
      this.activePreloads.delete(mediaId); // just in case it was still preloading
      this._processQueue();
      return player;
    }
    return null;
  }
}

export const WistiaSmartPreloader = new WistiaPreloadManager();

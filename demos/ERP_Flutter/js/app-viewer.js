const APP_WIDTH = 390;
const APP_HEIGHT = 844;

export function createAppViewer({ appUrl, mobileQuery, root = document }) {
  const desktopFrame = root.getElementById('desktop-app');
  const mobileFrame = root.getElementById('mobile-app');
  const screen = desktopFrame.parentElement;

  function mount() {
    const active = mobileQuery.matches ? mobileFrame : desktopFrame;
    const inactive = mobileQuery.matches ? desktopFrame : mobileFrame;
    if (inactive.hasAttribute('src')) inactive.removeAttribute('src');
    if (!active.hasAttribute('src')) active.setAttribute('src', appUrl);
  }

  function fitDesktopFrame() {
    const scale = Math.min(screen.clientWidth / APP_WIDTH, screen.clientHeight / APP_HEIGHT);
    screen.style.setProperty('--k', scale || 1);
    screen.style.setProperty('--app-h', `${scale ? screen.clientHeight / scale : APP_HEIGHT}px`);
  }

  function initialize() {
    mount();
    mobileQuery.addEventListener('change', mount);
    if (window.ResizeObserver) new ResizeObserver(fitDesktopFrame).observe(screen);
    fitDesktopFrame();
  }

  return { initialize };
}


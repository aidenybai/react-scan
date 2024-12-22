import noReactStyles from '../assets/css/no-react.css?inline';
import { loadCss } from '../utils/helpers';

let backdrop: HTMLDivElement | null = null;
let isAnimating = false;

export const createReactNotAvailableUI = () => {
  if (backdrop) return;

  backdrop = document.createElement('div');
  backdrop.id = 'react-scan-backdrop';
  backdrop.style.opacity = '0';
  backdrop.style.pointerEvents = 'none';

  const toast = document.createElement('div');
  toast.id = 'react-scan-toast';
  toast.onclick = (e) => {
    e.stopPropagation();
  };

  const message = document.createElement('span');
  message.id = 'react-scan-toast-message';
  message.innerHTML = "<span class='icon'>⚛️</span> React is not detected on this page. <br />Please ensure you're visiting a React application!";
  toast.appendChild(message);

  const button = document.createElement('button');
  button.id = 'react-scan-toast-close-button';
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  button.onclick = (e) => {
    e.stopPropagation();
    toggleReactIsNotAvailable();
  };
  toast.appendChild(button);

  backdrop.appendChild(toast);
  backdrop.onclick = toggleReactIsNotAvailable;

  const style = document.createElement('style');
  style.id = 'react-scan-no-react-styles';
  style.innerHTML = noReactStyles;

  const fragment = document.createDocumentFragment();
  fragment.appendChild(style);
  fragment.appendChild(backdrop);

  document.documentElement.appendChild(fragment);
  void loadCss(noReactStyles);
};

export const toggleReactIsNotAvailable = () => {
  if (!backdrop || isAnimating) return;
  isAnimating = true;

  const handleTransitionEnd = () => {
    isAnimating = false;
    backdrop?.removeEventListener('transitionend', handleTransitionEnd);
  };

  backdrop.addEventListener('transitionend', handleTransitionEnd);

  const isVisible = backdrop.style.opacity === '1';
  backdrop.style.opacity = isVisible ? '0' : '1';
  backdrop.style.pointerEvents = isVisible ? 'none' : 'auto';
  document.documentElement.classList.toggle('freeze', isVisible);
};

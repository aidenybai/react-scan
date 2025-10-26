import noReactStyles from '~assets/css/no-react.css?inline';
import type { IEvents } from '~types/messages';
import { busDispatch } from '~utils/helpers';

let backdrop: HTMLDivElement | null = null;
let isAnimating = false;

const defaultTitle = 'React Not Detected';
const defaultContent =
  "React is not detected on this page. \nPlease ensure you're visiting a React application!";

export const createNotificationUI = ({
  title = defaultTitle,
  content = defaultContent,
}) => {
  busDispatch<IEvents['react-scan:send-to-background']>(
    'react-scan:send-to-background',
    {
      topic: 'react-scan:send-to-background',
      message: {
        type: 'react-scan:is-enabled',
        data: {
          state: false,
        },
      },
    },
  );

  if (backdrop) {
    return;
  }

  backdrop = document.createElement('div');
  backdrop.id = 'react-scan-backdrop';
  backdrop.style.opacity = '0';
  backdrop.style.pointerEvents = 'none';

  const toast = document.createElement('div');
  toast.id = 'react-scan-toast';
  toast.onclick = (e) => {
    e.stopPropagation();
  };

  // Create title element
  const titleElement = document.createElement('div');
  titleElement.id = 'react-scan-toast-title';

  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.textContent = '⚛️';
  titleElement.appendChild(icon);

  const titleText = document.createElement('span');
  titleText.textContent = title;
  titleElement.appendChild(titleText);

  toast.appendChild(titleElement);

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.id = 'react-scan-toast-message';

  const text = document.createElement('span');
  text.textContent = content;
  text.style.whiteSpace = 'pre-line'; // Preserve line breaks
  messageElement.appendChild(text);

  toast.appendChild(messageElement);

  const button = document.createElement('button');
  button.id = 'react-scan-toast-close-button';
  button.type = 'button';
  button.onclick = toggleNotification;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '18');
  line1.setAttribute('y1', '6');
  line1.setAttribute('x2', '6');
  line1.setAttribute('y2', '18');

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '6');
  line2.setAttribute('y1', '6');
  line2.setAttribute('x2', '18');
  line2.setAttribute('y2', '18');

  svg.appendChild(line1);
  svg.appendChild(line2);
  button.appendChild(svg);

  toast.appendChild(button);

  backdrop.appendChild(toast);
  backdrop.onclick = toggleNotification;

  const style = document.createElement('style');
  style.id = 'react-scan-no-react-styles';
  style.appendChild(document.createTextNode(noReactStyles));

  const fragment = document.createDocumentFragment();
  fragment.appendChild(style);
  fragment.appendChild(backdrop);

  document.documentElement.appendChild(fragment);
};

export const toggleNotification = () => {
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
  document.documentElement.classList.toggle('freeze', !isVisible);
};

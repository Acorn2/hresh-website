const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusableElements(container) {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
    const style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none';
  });
}

export function setupModalFocus({ container, initialFocus, onEscape, restoreFocus }) {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const root = document.getElementById('root');
  const previousRootInert = root?.inert ?? false;
  const previousRootAriaHidden = root?.getAttribute('aria-hidden');
  const html = document.documentElement;
  const body = document.body;
  const previousScrollY = window.scrollY;
  const previousHtmlOverflow = html.style.overflow;
  const previousBodyStyles = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };

  // 锁定滚动容器并固定 body，避免移动端触摸滚动穿透到背景页面。
  html.classList.add('modal-open');
  html.style.overflow = 'hidden';
  body.classList.add('modal-open');
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${previousScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';

  if (root) {
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
  }

  const focusFirst = () => {
    const target = initialFocus?.current || initialFocus || getFocusableElements(container)[0];
    target?.focus({ preventScroll: true });
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onEscape();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onFocusIn = (event) => {
    if (!container.contains(event.target)) focusFirst();
  };

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('focusin', onFocusIn, true);
  window.requestAnimationFrame(focusFirst);

  return () => {
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('focusin', onFocusIn, true);

    if (root) {
      root.inert = previousRootInert;
      if (previousRootAriaHidden === null) root.removeAttribute('aria-hidden');
      else root.setAttribute('aria-hidden', previousRootAriaHidden);
    }

    html.classList.remove('modal-open');
    html.style.overflow = previousHtmlOverflow;
    body.classList.remove('modal-open');
    Object.entries(previousBodyStyles).forEach(([property, value]) => {
      body.style[property] = value;
    });
    window.scrollTo(0, previousScrollY);

    const target = restoreFocus?.current || restoreFocus;
    if (target?.isConnected && !target.disabled) target.focus({ preventScroll: true });
    else if (previousFocus?.isConnected && !previousFocus.disabled) previousFocus.focus({ preventScroll: true });
  };
}

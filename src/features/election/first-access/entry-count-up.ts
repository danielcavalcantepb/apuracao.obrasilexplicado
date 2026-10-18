export type DisplayedNumber = { value: number; decimals: number; prefix: string; suffix: string };
export function parseDisplayedNumber(text: string): DisplayedNumber | null {
  const match = text.trim().match(/^([+−-]?)(\d[\d.]*(?:,\d+)?)(.*)$/);
  if (!match) return null;
  const value = Number(match[2].replaceAll('.', '').replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  return {
    value,
    decimals: match[2].split(',')[1]?.length ?? 0,
    prefix: match[1],
    suffix: match[3],
  };
}
export function countUpValue(value: number, progress: number) {
  const position = Math.max(0, Math.min(1, progress));
  return value * (1 - (1 - position) ** 3);
}

const selectors = [
  '.race-progress>strong',
  '.cockpit-top-two .cockpit-candidate>b',
  '.cockpit-top-two .cockpit-candidate>span:not(.portrait-fallback)',
  '.compact-candidate-row>strong',
  '.regional-score>span>b',
  '.regional-score>em',
  '.region-name>small',
  '.map-callouts b',
].join(',');

/** Animate a separate, aria-hidden CSS layer. React's official text and snapshots never change. */
export function startEntryCountUp(
  root: HTMLElement,
  phase: (value: 'running' | 'complete') => void,
) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet<HTMLElement>();
  const active = new Map<
    HTMLElement,
    {
      text: string;
      value: DisplayedNumber;
      layer: HTMLSpanElement;
      started: number;
      format: Intl.NumberFormat;
    }
  >();
  let frame = 0,
    stopped = false;
  const finish = (element: HTMLElement) => {
    const record = active.get(element);
    if (!record) return;
    record.layer.remove();
    element.classList.remove('entry-count-target');
    active.delete(element);
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    active.forEach((_, element) => finish(element));
    phase('complete');
  };
  const tick = (now: number) => {
    active.forEach((record, element) => {
      if (!element.isConnected || element.textContent !== record.text) {
        finish(element);
        return;
      }
      const progress = Math.max(0, Math.min(1, (now - record.started) / 1200));
      record.layer.dataset.countValue =
        record.value.prefix + record.format.format(countUpValue(record.value.value, progress));
      if (progress === 1) finish(element);
    });
    if (active.size) frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      phase('complete');
    }
  };
  const discover = () => {
    if (stopped || motion.matches) return;
    root.querySelectorAll<HTMLElement>(selectors).forEach((element) => {
      if (seen.has(element)) return;
      const text = element.textContent ?? '',
        value = parseDisplayedNumber(text);
      if (!value) return; // Missing official values remain dashes, never zero.
      seen.add(element);
      if (value.value === 0) return;
      const layer = document.createElement('span');
      layer.className = 'entry-count-text';
      layer.dataset.entryCounter = 'true';
      layer.setAttribute('aria-hidden', 'true');
      const suffix = document.createElement(element.querySelector('small') ? 'small' : 'span');
      suffix.className = 'entry-count-suffix';
      suffix.dataset.countSuffix = value.suffix;
      layer.append(suffix);
      const format = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: value.decimals,
        maximumFractionDigits: value.decimals,
      });
      layer.dataset.countValue = value.prefix + format.format(0);
      const secondary = element.closest('.region-sidebar,.map-callouts,.other-candidates');
      const kind = element.matches('.cockpit-candidate>span,.region-name>small')
        ? 'muted'
        : element.matches('em')
          ? 'secondary'
          : 'primary';
      layer.dataset.countKind = kind;
      active.set(element, {
        text,
        value,
        layer,
        format,
        started: performance.now() + (secondary ? 120 : 0),
      });
      element.classList.add('entry-count-target');
      element.append(layer);
    });
    if (active.size && !frame) {
      phase('running');
      frame = requestAnimationFrame(tick);
    } else if (!active.size) phase('complete');
  };
  const observer = new MutationObserver(() => {
    active.forEach((record, element) => {
      if (!element.isConnected || element.textContent !== record.text) finish(element);
    });
    discover();
  });
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (motion.matches) stop();
    else discover();
  });
  const expiry = setTimeout(stop, 15000);
  const changed = () => {
    if (motion.matches) stop();
  };
  motion.addEventListener('change', changed);
  root.addEventListener('pointerdown', stop, { capture: true, passive: true });
  root.addEventListener('keydown', stop, { capture: true });
  return () => {
    stop();
    clearTimeout(expiry);
    motion.removeEventListener('change', changed);
    root.removeEventListener('pointerdown', stop, true);
    root.removeEventListener('keydown', stop, true);
  };
}

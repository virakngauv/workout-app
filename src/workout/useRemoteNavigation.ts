import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

// Native TV uses Pressable's built-in directional focus. This browser-only
// counterpart makes the development preview operable with a keyboard.
export function useRemoteNavigation(onBack: () => boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const handler = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => handler.remove();
    }
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        if (onBack()) event.preventDefault();
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const buttons = Array.from(document.querySelectorAll<HTMLElement>('[role="button"]')).filter(node => node.getBoundingClientRect().width > 0);
      const current = document.activeElement as HTMLElement | null;
      if (!current || !buttons.includes(current)) { buttons[0]?.focus(); event.preventDefault(); return; }
      const rect = current.getBoundingClientRect();
      const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
      const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
      const sign = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const candidates = buttons.filter(node => node !== current).map(node => {
        const box = node.getBoundingClientRect();
        const dx = box.x + box.width / 2 - x, dy = box.y + box.height / 2 - y;
        const forward = (horizontal ? dx : dy) * sign;
        const cross = Math.abs(horizontal ? dy : dx);
        return { node, forward, score: forward + cross * 3 };
      }).filter(candidate => candidate.forward > 8).sort((a, b) => a.score - b.score);
      candidates[0]?.node.focus();
      event.preventDefault();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onBack]);
}

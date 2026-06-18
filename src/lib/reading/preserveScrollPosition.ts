/** レイアウト変化後も anchor 要素が画面上の同じ位置に留まるよう scroll を補正する */
export function preserveScrollPosition(anchor: HTMLElement, apply: () => void): void {
  const beforeTop = anchor.getBoundingClientRect().top;
  apply();
  const afterTop = anchor.getBoundingClientRect().top;
  const delta = afterTop - beforeTop;
  if (Math.abs(delta) > 0.5) {
    window.scrollBy(0, delta);
  }
}

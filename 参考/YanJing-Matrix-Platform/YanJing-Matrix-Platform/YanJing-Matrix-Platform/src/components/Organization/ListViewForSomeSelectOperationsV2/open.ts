import { createApp, h } from 'vue';
import { createPinia, getActivePinia, type Pinia } from 'pinia';
import Selector from './index.vue';
import type { OrgNodeV2 } from '@/types/Organization';

let app: ReturnType<typeof createApp> | null = null;
let rootEl: HTMLElement | null = null;

export type SelectorCategoryV2 = 'department' | 'post' | 'person';

interface SelectorOptionsV2 {
  appid: string;
  category: SelectorCategoryV2;
  title?: string;
  onSelect?: (item: OrgNodeV2) => void;
  onClose?: () => void;
  pinia?: Pinia;
}

export function openSelectorV2(options: SelectorOptionsV2) {
  if (rootEl) {
    closeSelectorV2();
  }

  rootEl = document.createElement('div');
  document.body.appendChild(rootEl);

  app = createApp({
    render() {
      return h(Selector, {
        appid: options.appid,
        category: options.category,
        title: options.title,
        onSelect: (item: OrgNodeV2) => {
          options.onSelect?.(item);
        },
        onClose: () => {
          options.onClose?.();
          closeSelectorV2();
        },
      });
    },
  });

  const pinia = options.pinia || getActivePinia() || createPinia();
  app.use(pinia);

  app.mount(rootEl);
}

export function closeSelectorV2() {
  if (app) {
    app.unmount();
    app = null;
  }
  if (rootEl) {
    document.body.removeChild(rootEl);
    rootEl = null;
  }
}

export function selectOrgNodeV2(options: Omit<SelectorOptionsV2, 'onSelect' | 'onClose'>): Promise<OrgNodeV2 | null> {
  return new Promise((resolve) => {
    openSelectorV2({
      ...options,
      onSelect: (item) => resolve(item),
      onClose: () => resolve(null),
    });
  });
}

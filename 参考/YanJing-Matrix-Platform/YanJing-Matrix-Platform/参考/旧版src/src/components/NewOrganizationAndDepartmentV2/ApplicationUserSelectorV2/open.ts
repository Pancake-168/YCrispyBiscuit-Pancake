import { createApp, h } from 'vue';
import { createPinia, getActivePinia, type Pinia } from 'pinia';
import Selector from './index.vue';
import type { ApplicationUserItem } from '@/types/application';

let app: ReturnType<typeof createApp> | null = null;
let rootEl: HTMLElement | null = null;

export type ApplicationUserSelectorTargetType = 'user' | 'bot';

interface ApplicationUserSelectorOptions {
  appid: string;
  targetType: ApplicationUserSelectorTargetType;
  title?: string;
  pinia?: Pinia;
  onSelect?: (item: ApplicationUserItem) => void;
  onClose?: () => void;
}

export function openApplicationUserSelectorV2(options: ApplicationUserSelectorOptions) {
  if (rootEl) {
    closeApplicationUserSelectorV2();
  }

  rootEl = document.createElement('div');
  document.body.appendChild(rootEl);

  app = createApp({
    render() {
      return h(Selector, {
        appid: options.appid,
        targetType: options.targetType,
        title: options.title,
        onSelect: (item: ApplicationUserItem) => {
          options.onSelect?.(item);
        },
        onClose: () => {
          options.onClose?.();
          closeApplicationUserSelectorV2();
        },
      });
    },
  });

  const pinia = options.pinia || getActivePinia() || createPinia();
  app.use(pinia);

  app.mount(rootEl);
}

export function closeApplicationUserSelectorV2() {
  if (app) {
    app.unmount();
    app = null;
  }
  if (rootEl) {
    document.body.removeChild(rootEl);
    rootEl = null;
  }
}

export function selectApplicationUserV2(options: Omit<ApplicationUserSelectorOptions, 'onSelect' | 'onClose'>): Promise<ApplicationUserItem | null> {
  return new Promise((resolve) => {
    openApplicationUserSelectorV2({
      ...options,
      onSelect: (item) => resolve(item),
      onClose: () => resolve(null),
    });
  });
}

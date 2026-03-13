import { createApp, h } from 'vue';
import { createPinia, getActivePinia, type Pinia } from 'pinia';
import SetPostDialog from './SetPostDialog.vue';

let app: ReturnType<typeof createApp> | null = null;
let rootEl: HTMLElement | null = null;

interface OpenSetPostOptions {
  appid: string;
  postId: number;
  initialName: string;
  initialDescription: string;
  initialUserIds: number[];
  pinia?: Pinia;
  onUpdated?: (payload: { name: string; description: string; userIds: number[] }) => void;
}

export function openSetPostDialog(options: OpenSetPostOptions) {
  if (rootEl) {
    closeSetPostDialog();
  }

  rootEl = document.createElement('div');
  document.body.appendChild(rootEl);

  app = createApp({
    render: () =>
      h(SetPostDialog, {
        appid: options.appid,
        postId: options.postId,
        initialName: options.initialName,
        initialDescription: options.initialDescription,
        initialUserIds: options.initialUserIds,
        onUpdated: options.onUpdated,
        onClose: closeSetPostDialog,
      }),
  });

  const pinia = options.pinia || getActivePinia() || createPinia();
  app.use(pinia);

  app.mount(rootEl);
}

export function closeSetPostDialog() {
  if (app) {
    app.unmount();
    app = null;
  }

  if (rootEl) {
    document.body.removeChild(rootEl);
    rootEl = null;
  }
}

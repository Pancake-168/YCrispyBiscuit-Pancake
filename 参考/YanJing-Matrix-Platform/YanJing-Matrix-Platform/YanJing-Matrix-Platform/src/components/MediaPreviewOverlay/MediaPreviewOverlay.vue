<template>
  <div class="preview-mask" @click.self="emit('close')">
    <button class="preview-close" type="button" @click="emit('close')">&times;</button>
    <div class="preview-stage">
      <MessagePic
        v-if="kind === 'image'"
        preview-only
        :content="fileName || ''"
        :image-url="url"
        :alt-text="fileName || '图片'"
        :image-size="fileSize"
        :mxc-url="mxcUrl"
        :message-info="mimeType ? { mimetype: mimeType } : undefined"
      />
      <MessageVideo
        v-else
        preview-only
        :content="fileName || ''"
        :file-url="url"
        :file-name="fileName"
        :file-size="fileSize"
        :mxc-url="mxcUrl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MessagePic from '@/components/Room/MessageItem/MessageElement/MessagePic'
import MessageVideo from '@/components/Room/MessageItem/MessageElement/MessageVideo'

defineProps<{
  kind: 'image' | 'video'
  fileName?: string
  fileSize?: number
  mimeType?: string
  url?: string
  mxcUrl?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.preview-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--bg-color) 78%, #000 22%);
  backdrop-filter: blur(2px);
}

.preview-stage {
  position: relative;
  width: min(96vw, 1400px);
  height: min(92vh, 980px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: var(--font-lg);
  line-height: 1;
  color: var(--btn-text);
  background: color-mix(in srgb, var(--bg-color) 45%, transparent);
}

.preview-close:hover {
  background: color-mix(in srgb, var(--bg-color) 62%, transparent);
}
</style>
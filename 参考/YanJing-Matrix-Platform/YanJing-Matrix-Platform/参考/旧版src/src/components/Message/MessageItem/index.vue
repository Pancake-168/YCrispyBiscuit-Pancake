<template>
  <div class="message-item" :class="[
    { 'own-message': isOwnMessage },
    isFirstInGroup ? 'first-in-group' : '',
    isContinuedInGroup ? 'continued-in-group' : ''
  ]" :data-event-id="eventId" :data-time="formatFullDateTime(timestamp)">
    <template v-if="isOwnMessage">
      <div v-if="isFirstInGroup" class="right-avatar-container">
        <div class="right-avatar">{{ getInitials(sender) }}</div>
      </div>
      <div class="right-message-content">
        <div class="right-message-header">
          <span v-if="isFirstInGroup" class="right-sender-name"
            @click="handleMentionUser(sender, getDisplayName(sender))">{{ getDisplayName(sender) }}</span>
          <span v-if="isFirstInGroup" class="right-message-time">{{ formatTime(timestamp) }}</span>
          <!--span v-if="encrypted && isFirstInGroup" class="right-encrypted-indicator" title="加密消息">🔒</span-->
        </div>
        <!-- 回复预览（单层，紧凑） -->
        <div v-if="replyPreview" class="reply-preview" @click="onClickReplyPreview">
          <div class="reply-header">
            <span class="reply-sender">{{ replyPreview.senderName || replyPreview.senderId }}</span>
            <span v-if="replyBadgeLabel" class="reply-badge">{{ replyBadgeLabel }}</span>
          </div>
          <div class="reply-summary">{{ replyPreview.summary }}</div>
        </div>
        <div :class="['right-message-body', { 'media-message': isMediaMessage }]"><!-- 媒体消息扩展类 -->
          <!-- 根据消息类型渲染不同的组件 -->
          <!--MessageMarkdown
            v-if="messageType === 'm.text' && ((format === 'org.matrix.custom.html' && !!formattedBody) || isMarkdownContent)"
            :content="format === 'org.matrix.custom.html' && formattedBody ? formattedBody : content"
            :stream-mode="isStreamMode" /-->
          <MessageMarkdown v-if="messageType === 'm.text'"
            :content="format === 'org.matrix.custom.html' && formattedBody ? formattedBody : content"
            :stream-mode="isStreamMode" />
          <MessagePic v-else-if="messageType === 'm.image'" :content="content" :image-url="imageUrl" :alt-text="altText"
            :image-size="imageSize" :show-image-info="true" :mxc-url="mxcUrl"
            :encryption-info="messageInfo?.encryptionInfo" :message-info="messageInfo" />
          <MessageFile v-else-if="messageType === 'm.file'" :content="content" :file-url="fileUrl" :file-name="fileName"
            :file-size="fileSize" :mxc-url="mxcUrl" :encryption-info="messageInfo?.encryptionInfo"
            @download-encrypted="downloadAndDecryptFile" />
          <MessageFile v-else-if="messageType === 'm.audio'" :content="content" :file-url="fileUrl"
            :file-name="fileName" :file-size="fileSize" :mxc-url="mxcUrl" :is-audio="true"
            :encryption-info="messageInfo?.encryptionInfo" @download-encrypted="downloadAndDecryptFile" />
          <MessageFile v-else-if="messageType === 'm.video'" :content="content" :file-url="fileUrl"
            :file-name="fileName" :file-size="fileSize" :mxc-url="mxcUrl" :is-video="true"
            :encryption-info="messageInfo?.encryptionInfo" @download-encrypted="downloadAndDecryptFile" />
          <!-- 纯文本消息 -->
          <div v-else class="right-text-message">
            <p>{{ content }}</p>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div v-if="isFirstInGroup" class="left-avatar-container">
        <div class="left-avatar">{{ getInitials(sender) }}</div>
      </div>
      <div class="left-message-content">
        <div class="left-message-header">
          <span v-if="isFirstInGroup" class="left-sender-name"
            @click="handleMentionUser(sender, getDisplayName(sender))">{{ getDisplayName(sender) }}</span>
          <span v-if="isFirstInGroup" class="left-message-time">{{ formatTime(timestamp) }}</span>
          <!--span v-if="encrypted && isFirstInGroup" class="left-encrypted-indicator" title="加密消息">🔒</span-->
        </div>
        <!-- 回复预览（单层，紧凑） -->
        <div v-if="replyPreview" class="reply-preview" @click="onClickReplyPreview">
          <div class="reply-header">
            <span class="reply-sender">{{ replyPreview.senderName || replyPreview.senderId }}</span>
            <span v-if="replyBadgeLabel" class="reply-badge">{{ replyBadgeLabel }}</span>
          </div>
          <div class="reply-summary">{{ replyPreview.summary }}</div>
        </div>
        <div :class="['left-message-body', { 'media-message': isMediaMessage }]"><!-- 媒体消息扩展类 -->
          <!-- 根据消息类型渲染不同的组件 -->
          <MessageMarkdown v-if="messageType === 'm.text'"
            :content="format === 'org.matrix.custom.html' && formattedBody ? formattedBody : content"
            :stream-mode="isStreamMode" />
          <MessagePic v-else-if="messageType === 'm.image'" :content="content" :image-url="imageUrl" :alt-text="altText"
            :image-size="imageSize" :show-image-info="true" :mxc-url="mxcUrl"
            :encryption-info="messageInfo?.encryptionInfo" :message-info="messageInfo" />
          <MessageFile v-else-if="messageType === 'm.file'" :content="content" :file-url="fileUrl" :file-name="fileName"
            :file-size="fileSize" :mxc-url="mxcUrl" :encryption-info="messageInfo?.encryptionInfo"
            @download-encrypted="downloadAndDecryptFile" />
          <MessageFile v-else-if="messageType === 'm.audio'" :content="content" :file-url="fileUrl"
            :file-name="fileName" :file-size="fileSize" :mxc-url="mxcUrl" :is-audio="true"
            :encryption-info="messageInfo?.encryptionInfo" @download-encrypted="downloadAndDecryptFile" />
          <MessageFile v-else-if="messageType === 'm.video'" :content="content" :file-url="fileUrl"
            :file-name="fileName" :file-size="fileSize" :mxc-url="mxcUrl" :is-video="true"
            :encryption-info="messageInfo?.encryptionInfo" @download-encrypted="downloadAndDecryptFile" />
          <!-- 纯文本消息 -->
          <div v-else class="left-text-message">
            <p>{{ content }}</p>
          </div>
        </div>
      </div>
    </template>
    <div class="operations" role="toolbar" aria-label="Message Actions">
      <div class="mx_MessageActionBar_iconButton" role="button" tabindex="0" :aria-label="ariaLabels.reply"
        :data-tooltip="titles.reply" @click.stop.prevent="handleReplyClick"
        @keydown.enter.stop.prevent="handleReplyClick" @keydown.space.stop.prevent="handleReplyClick">
        <svg t="1763026822776" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="2385" width="200" height="200">
          <path
            d="M156.09136 606.57001a457.596822 457.596822 0 0 1 221.680239-392.516385 50.844091 50.844091 0 1 1 50.844091 86.943396 355.90864 355.90864 0 0 0-138.804369 152.532274h16.77855a152.532274 152.532274 0 1 1-152.532274 152.532274z m406.752731 0a457.596822 457.596822 0 0 1 221.680239-392.007944 50.844091 50.844091 0 1 1 50.844091 86.943396 355.90864 355.90864 0 0 0-138.804369 152.532274h16.77855a152.532274 152.532274 0 1 1-152.532274 152.532274z"
            fill="#666666" p-id="2386"></path>
        </svg>
      </div>

      <div v-if="isMediaMessage" class="mx_MessageActionBar_iconButton" role="button" tabindex="0"
        :aria-label="ariaLabels.download" :data-tooltip="titles.download" @click="onClickDownload"
        @keydown.enter.stop.prevent="onClickDownload" @keydown.space.stop.prevent="onClickDownload">
        <svg t="1763026878687" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="3391" width="200" height="200">
          <path
            d="M921.84736468 997.93033544H101.54506534c-24.68943392 0-44.71162586-20.00838352-44.71162584-44.71162585V631.455181c0-24.70324234 20.02219194-44.71162586 44.71162584-44.71162585s44.71162586 20.00838352 44.71162586 44.71162585v277.05190275h730.87904765V631.455181c0-24.70324234 20.02219194-44.71162586 44.71162583-44.71162585 24.68943392 0 44.71162586 20.00838352 44.71162586 44.71162585V953.21870959c0 24.70324234-20.02219194 44.71162586-44.71162586 44.71162585z"
            fill="#2c2c2c" p-id="3392"></path>
          <path
            d="M511.69621502 839.9897621c-24.68943392 0-44.71162586-20.00838352-44.71162585-44.71162585V70.54383027c0-24.70324234 20.02219194-44.71162586 44.71162585-44.71162586s44.71162586 20.00838352 44.71162585 44.71162586v724.73430598c0 24.70324234-20.02219194 44.71162586-44.71162585 44.71162585z"
            fill="#2c2c2c" p-id="3393"></path>
          <path
            d="M511.69621502 869.73307344c-14.37455297 0-27.92060144-6.93182094-36.30230524-18.61373431L323.62569491 639.87831001c-14.41597819-20.04980875-9.84539506-47.998027 10.21822209-62.41400518 20.02219194-14.37455297 47.94279339-9.85920347 62.3863884 10.21822208l115.47971803 160.70225499 115.45210121-160.68844659c14.443595-20.09123397 42.37800485-24.60658347 62.38638839-10.23203048 20.04980875 14.41597819 24.62039188 42.33657964 10.21822208 62.40019679l-151.75440644 211.2272207a44.65639221 44.65639221 0 0 1-36.31611365 18.64135112z"
            fill="#2c2c2c" p-id="3394"></path>
        </svg>
      </div>

      <!-- 音频专属：音频转录（占位按钮，后续接入真实 SVG 和功能） -->
      <div v-if="messageType === 'm.audio'" class="mx_MessageActionBar_iconButton" role="button" tabindex="0"
        :aria-label="ariaLabels.transcribe" :data-tooltip="titles.transcribe">
        <svg t="1763027395020" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="10328" width="200" height="200">
          <path
            d="M488.01 896.65c-74.21 0-142.25-24.74-210.27-68.03-6.19-6.18-49.48-12.37-74.21-12.37-68.03-6.18-111.32-18.55-129.87-43.29-24.74-30.92 6.19-68.03 24.73-92.77 12.37-18.55 30.92-43.29 30.92-49.47-12.37-49.48-18.55-80.4-18.55-129.87 0-92.77 24.74-173.16 68.03-235.01 68.03-92.77 179.34-148.43 309.22-148.43 210.27 0 358.69 142.24 383.43 377.25 0 18.56-12.37 30.92-24.73 37.11-18.55 0-30.92-12.37-37.11-24.74-24.74-210.27-142.24-327.77-321.58-327.77-111.32 0-204.08 43.29-259.75 123.68-37.1 49.48-55.66 117.5-55.66 197.9 0 43.29 6.19 68.03 18.55 117.5 12.37 43.29-18.55 80.39-43.29 105.13-6.19 6.19-12.37 12.37-12.37 18.55 18.55 6.19 55.66 12.37 80.39 12.37 49.48 6.19 80.4 12.37 98.95 24.74 80.4 55.66 179.35 68.03 265.93 43.29 18.55-6.19 30.92 6.18 37.11 18.55 6.18 18.56-6.19 30.92-18.55 37.11-43.29 12.39-74.21 18.57-111.32 18.57z"
            fill="#333333" p-id="10329"></path>
          <path
            d="M927.1 717.3H642.62c-18.55 0-30.92-12.37-30.92-30.92s12.37-30.92 30.92-30.92H927.1c18.55 0 30.92 12.37 30.92 30.92 0 18.56-12.37 30.92-30.92 30.92z"
            fill="#333333" p-id="10330"></path>
          <path
            d="M729.2 909.02h-6.19c-18.55-6.19-24.74-24.74-18.55-37.11l55.66-191.72c6.18-18.55 24.74-24.73 37.1-18.55 18.55 6.18 24.74 24.74 18.55 37.1l-55.66 185.53c-6.17 18.56-18.54 24.75-30.91 24.75zM351.96 599.8c-18.55 0-30.92-12.37-30.92-30.92V377.16c0-18.55 12.37-30.92 30.92-30.92s30.92 12.37 30.92 30.92v191.72c0 18.55-12.37 30.92-30.92 30.92z m235-12.37c-18.55 0-30.92-12.37-30.92-30.92V377.16c0-18.55 12.37-30.92 30.92-30.92s30.92 12.37 30.92 30.92v179.35c0.01 18.55-18.55 30.92-30.92 30.92z m-117.5 68.03c-18.55 0-30.92-12.37-30.92-30.92V315.32c0-18.55 12.37-30.92 30.92-30.92 18.55 0 30.92 12.37 30.92 30.92v309.22c0 18.55-12.37 30.92-30.92 30.92z"
            fill="#333333" p-id="10331"></path>
        </svg>
      </div>

      <div class="mx_MessageActionBar_iconButton" role="button" tabindex="0" :aria-label="ariaLabels.edit"
        :data-tooltip="titles.edit">
        <svg t="1763026912145" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="4385" width="200" height="200">
          <path
            d="M469.333333 128a42.666667 42.666667 0 0 1 0 85.333333H213.333333v597.333334h597.333334v-256l0.298666-4.992A42.666667 42.666667 0 0 1 896 554.666667v256a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333V213.333333a85.333333 85.333333 0 0 1 85.333333-85.333333z m414.72 12.501333a42.666667 42.666667 0 0 1 0 60.330667L491.861333 593.066667a42.666667 42.666667 0 0 1-60.330666-60.330667l392.192-392.192a42.666667 42.666667 0 0 1 60.330666 0z"
            fill="#000000" p-id="4386"></path>
        </svg>
      </div>

      <div class="mx_MessageActionBar_iconButton" role="button" tabindex="0" :aria-label="ariaLabels.forward"
        :data-tooltip="titles.forward">
        <svg t="1763026950619" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="6352" width="200" height="200">
          <path
            d="M892.7 896.1H131.3c-18.4 0-33.3-14.9-33.3-33.3V696.4c0-18.4 14.9-33.3 33.3-33.3h30c18.4 0 33.3 14.9 33.3 33.3 0 4.5-0.9 8.9-2.6 12.8l-13 64.9c0 18.4 14.9 33.3 33.3 33.3h599.3c18.4 0 33.3-14.9 33.3-33.3l-13-64.9c-1.7-4-2.6-8.3-2.6-12.8 0-18.4 14.9-33.3 33.3-33.3h30c18.4 0 33.3 14.9 33.3 33.3v166.5c0.1 18.3-14.8 33.2-33.2 33.2zM580 582h1l-1 0.9v-0.9z m247.2-228.6l1.6 0.1-234.7 216.4v-2.3h-0.1c-0.3 3.7-3.4 6.7-7.2 6.7-4 0-7.2-3.2-7.2-7.2 0-0.7 0.1-1.3 0.3-1.9V433.3c-11.4-0.7-23-1.1-34.7-1.1-134.7 0-247.2 95.2-273.7 222.1-12.1-18.3-17.1-49.1-17.1-100 0-154.5 125.2-294.1 279.7-294.1 15.8 0 31.1 0.1 45.8 0.4V136.1c-0.2-0.6-0.3-1.2-0.3-1.9 0-4 3.2-7.2 7.2-7.2 3.8 0 6.9 2.9 7.2 6.7h0.1v-1.8L829.6 339h-2.4v0.1c3.7 0.3 6.7 3.4 6.7 7.2 0 3.7-3 6.8-6.7 7.1z"
            fill="" p-id="6353"></path>
        </svg>
      </div>

      <div class="mx_MessageActionBar_iconButton" role="button" :class="{ 'is-disabled': isDeleteDisabled }"
        :tabindex="isDeleteDisabled ? -1 : 0" :aria-disabled="isDeleteDisabled" :aria-label="deleteAriaLabel"
        :data-tooltip="deleteTooltip" @click.stop.prevent="handleDeleteClick"
        @keydown.enter.stop.prevent="handleDeleteClick" @keydown.space.stop.prevent="handleDeleteClick">
        <svg t="1763026968313" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="7337" width="200" height="200">
          <path
            d="M519.620465 0c-103.924093 0-188.511256 82.467721-192.083349 185.820279H85.015814A48.91386 48.91386 0 0 0 36.101953 234.686512a48.91386 48.91386 0 0 0 48.913861 48.866232h54.010046V831.345116c0 102.852465 69.822512 186.844279 155.909954 186.844279h439.200744c86.087442 0 155.909953-83.491721 155.909954-186.844279V284.100465h48.91386a48.91386 48.91386 0 0 0 48.913861-48.890046 48.91386 48.91386 0 0 0-48.913861-48.866233h-227.756651A191.559442 191.559442 0 0 0 519.620465 0z m-107.234232 177.080558c3.548279-49.771163 46.627721-88.540279 99.851907-88.540279 53.224186 0 96.327442 38.745302 99.351813 88.540279h-199.20372z m-111.997024 752.044651c-30.981953 0-65.083535-39.15014-65.083535-95.041488V287.744h575.488v546.839814c0 55.915163-34.077767 95.041488-65.059721 95.041488H300.389209v-0.500093z"
            fill="#D81E06" p-id="7338"></path>
          <path
            d="M368.116093 796.814884c24.361674 0 44.27014-21.670698 44.27014-48.818605v-278.623256c0-27.147907-19.908465-48.818605-44.27014-48.818604-24.33786 0-44.27014 21.670698-44.27014 48.818604v278.623256c0 27.147907 19.360744 48.818605 44.293954 48.818605z m154.933581 0c24.361674 0 44.293953-21.670698 44.293954-48.818605v-278.623256c0-27.147907-19.932279-48.818605-44.293954-48.818604-24.33786 0-44.27014 21.670698-44.270139 48.818604v278.623256c0 27.147907 19.932279 48.818605 44.293953 48.818605z m132.810419 0c24.33786 0 44.27014-21.670698 44.27014-48.818605v-278.623256c0-27.147907-19.932279-48.818605-44.27014-48.818604s-44.27014 21.670698-44.27014 48.818604v278.623256c0 27.147907 19.360744 48.818605 44.27014 48.818605z"
            fill="#D81E06" p-id="7339"></path>
        </svg>
      </div>

      <div class="mx_MessageActionBar_iconButton" role="button" tabindex="0" :aria-label="ariaLabels.viewSource"
        :data-tooltip="titles.viewSource" @click="onClickViewSource" @keydown.enter.stop.prevent="onClickViewSource"
        @keydown.space.stop.prevent="onClickViewSource">
        <svg t="1763026987681" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="8390" width="200" height="200">
          <path
            d="M607.839811 895.957102H214.69447A86.82497 86.82497 0 0 1 127.880338 809.070721V214.784781A86.839419 86.839419 0 0 1 214.69447 127.880338h594.28594a86.33729 86.33729 0 0 1 61.436749 25.456857c16.400473 16.400473 25.362934 38.208767 25.373771 61.411462L894.439878 607.821749v0.10476a32.031496 32.031496 0 0 0 64.059379 0.101149L959.825022 214.889542v-0.104761A150.775976 150.775976 0 0 0 808.98041 63.940169H214.69447A150.638703 150.638703 0 0 0 63.940169 214.784781v594.28594a150.638703 150.638703 0 0 0 150.757914 150.82655h393.141728a31.970084 31.970084 0 0 0 0-63.940169z"
            fill="" p-id="8391"></path>
          <path
            d="M950.544667 905.331381l-122.071536-122.071536a192.217875 192.217875 0 1 0-45.213286 45.213286l122.071536 122.071536a31.970084 31.970084 0 0 0 45.213286-45.213286z m-278.547941-105.302594a128.028448 128.028448 0 1 1 90.531332-37.497116 127.193975 127.193975 0 0 1-90.527719 37.497116zM768.004516 352.212795c17.653989 0 31.966472-14.402794 31.970084-32.056783s-14.308871-32.074845-31.966472-32.078457L256.002709 287.911382a32.020659 32.020659 0 0 0-31.970084 32.024271c0 17.657601 14.308871 32.092907 31.966472 32.092908L768.004516 352.212795zM448.000226 544.033302a31.96286 31.96286 0 1 0 0-63.940169h-192.001129a31.937573 31.937573 0 1 0 0 63.878758l192.001129 0.061411zM256.017159 671.91364a31.959247 31.959247 0 1 0 0 63.922107l127.999549 0.018062a31.941185 31.941185 0 1 0 0-63.878757z"
            fill="" p-id="8392"></path>
        </svg>
      </div>
    </div>
  </div>
  <ViewSourceDialog v-model="showViewSource" :room-id="undefined" :event-id="eventId" />

</template>

<script setup lang="ts">
import { computed, ref, onMounted, inject, watch } from 'vue'
import { Attachment, EncryptedAttachment } from '@matrix-org/matrix-sdk-crypto-wasm'
import MessageMarkdown from './MessageElement/MessageMarkdown/Markdown.vue'
import MessagePic from './MessageElement/MessagePic/index.vue'
import MessageFile from './MessageElement/MessageFile/index.vue'
import { matrixClientV2 } from '../../../services/matrix/client'
import type { Matrix消息类型 } from '../../../types/matrix'
import type { MsgOperationType } from '../../../types/Operations'
import { downloadMedia } from '@/services/Operations/MsgDownload'
import { buildReplyPreviewFromChild } from '@/services/Operations/MsgReply'
import { checkDeleteEligibility, deleteMessage, type DeleteMode } from '@/services/Operations/MsgDelete'
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
import ViewSourceDialog from '@/components/ViewSourceDialog/index.vue'
import { resolveUserDisplayName } from '@/utils/displayName'

// Props
interface Props {
  eventId: string
  roomId?: string
  sender: string
  content: string
  timestamp: number
  encrypted: boolean
  currentUserId?: string
  messageType?: Matrix消息类型
  messageInfo?: any
  formattedBody?: string
  format?: string
  isFirstInGroup?: boolean // 是否为分组首条
  isContinuedInGroup?: boolean // 是否为分组后续
  displayName?: string // 用户显示名称
  isStreaming?: boolean // 是否为流式消息
}

const props = withDefaults(defineProps<Props>(), {
  messageType: 'm.text',
  isFirstInGroup: true,
  isContinuedInGroup: false,
  isStreaming: false
})

// 定义emit事件
const emit = defineEmits<{
  mentionUser: [userId: string, displayName: string]
}>()

const chatContext = inject<any>('chatContext', null)

// 点击昵称触发@功能
const handleMentionUser = (userId: string, displayName: string) => {
  emit('mentionUser', userId, displayName)
}

const handleReplyClick = () => {
  if (!props.roomId || !props.eventId) return
  chatContext?.setReplyTarget?.({ roomId: props.roomId, eventId: props.eventId })
}

// 下载并解密文件
const downloadAndDecryptFile = async () => {
  if (!props.messageInfo?.encryptionInfo || !props.messageInfo?.mxcUrl) {
    // 这里可以添加用户提示
    return;
  }

  try {
    const client = matrixClientV2.getAuthedClient();
    if (!client) {
      throw new Error('[V2] 研境AI客户端未认证');
    }

    // 1. 将 mxc:// URL 转换为可下载的 HTTP URL
    const httpUrl = client.mxcUrlToHttp(props.messageInfo.mxcUrl, null, null, null, true);
    if (!httpUrl) {
      throw new Error('[V2] 无法将MXC URL转换为HTTP URL');
    }

    // 2. 获取加密的文件内容
    const response = await fetch(httpUrl);
    if (!response.ok) {
      throw new Error(`[V2] 文件下载失败: ${response.statusText}`);
    }
    const encryptedData = await response.arrayBuffer();

    // 3. 解密文件内容
    const mediaEncryptionInfo = JSON.stringify(props.messageInfo.encryptionInfo);
    const encryptedAttachment = new EncryptedAttachment(new Uint8Array(encryptedData), mediaEncryptionInfo);
    const decryptedData = Attachment.decrypt(encryptedAttachment);

    // 4. 创建 Blob 并触发浏览器下载
    const arrayBuffer = decryptedData.buffer instanceof ArrayBuffer
      ? decryptedData.buffer
      : new ArrayBuffer(decryptedData.byteLength);

    if (arrayBuffer !== decryptedData.buffer) {
      new Uint8Array(arrayBuffer).set(new Uint8Array(decryptedData.buffer));
    }

    const blob = new Blob([arrayBuffer], { type: props.messageInfo.mimetype || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = props.messageInfo.filename || 'decrypted-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[V2] 解密和下载文件时出错:', error);
    // 在这里向用户显示错误消息
  }
};

// 是否为自己的消息
const isOwnMessage = computed(() => {
 /* console.log('[MessageItem] 计算isOwnMessage:', {
    currentUserId: props.currentUserId,
    sender: props.sender
  });
  */
  const result = props.currentUserId && props.sender === props.currentUserId
  return result
})




// 判断是否为Markdown内容
const isMarkdownContent = computed(() => {
  if (props.messageType !== 'm.text') return false

  const content = props.content
  // 检查是否包含Markdown语法
  const markdownPatterns = [
    /#{1,6}\s/,           // 标题
    /\*\*.*\*\*/,         // 粗体
    /\*.*\*/,             // 斜体
    /`.*`/,               // 行内代码
    /```[\s\S]*?```/,     // 代码块
    /^\s*[-*+]\s/m,       // 无序列表
    /^\s*\d+\.\s/m,       // 有序列表
    /^\s*>\s/m,           // 引用
    /!\[.*\]\(.*\)/,      // 图片
    /\[.*\]\(.*\)/,       // 链接
    /^\s*\|.*\|/m,        // 表格
    /^\s*-{3,}\s*$/m      // 分割线
  ]

  return markdownPatterns.some(pattern => pattern.test(content))
})




// 解析图片信息
const imageUrl = computed(() => {
  if (props.messageType !== 'm.image') return ''

  // 如果messageInfo中有url，使用它
  if (props.messageInfo?.url) {
    return props.messageInfo.url
  }

  // 否则尝试从content中解析
  const imageMatch = props.content.match(/!\[.*?\]\((.*?)\)/)
  return imageMatch ? imageMatch[1] : ''
})

const altText = computed(() => {
  if (props.messageType !== 'm.image') return ''

  if (props.messageInfo?.alt) {
    return props.messageInfo.alt
  }

  const altMatch = props.content.match(/!\[(.*?)\]/)
  return altMatch ? altMatch[1] : '图片'
})

// 解析文件信息
const fileUrl = computed(() => {
  if (!['m.file', 'm.audio', 'm.video'].includes(props.messageType!)) return ''

  if (props.messageInfo?.url) {
    return props.messageInfo.url
  }

  // 尝试从content中解析文件链接
  const urlMatch = props.content.match(/https?:\/\/[^\s]+/)
  if (urlMatch) {
    return urlMatch[0]
  }

  return ''
})

const fileName = computed(() => {
  if (!['m.file', 'm.audio', 'm.video'].includes(props.messageType!)) return ''

  if (props.messageInfo?.filename) {
    return props.messageInfo.filename
  }

  // 从fileUrl中提取文件名
  if (fileUrl.value) {
    try {
      const url = new URL(fileUrl.value)
      const pathParts = url.pathname.split('/')
      return pathParts[pathParts.length - 1] || '未知文件'
    } catch {
      return '未知文件'
    }
  }

  return props.content || '未知文件'
})

const fileSize = computed(() => {
  if (!['m.file', 'm.audio', 'm.video'].includes(props.messageType!)) return undefined

  if (props.messageInfo?.size) {
    return props.messageInfo.size
  }

  return undefined
})

// 获取原始mxc URL用于下载
const mxcUrl = computed(() => {
  if (!['m.file', 'm.audio', 'm.video', 'm.image'].includes(props.messageType!)) return ''

  // 从messageInfo中获取原始的mxc URL
  if (props.messageInfo?.mxcUrl) {
    return props.messageInfo.mxcUrl
  }

  // 如果没有存储mxc URL，尝试从当前的HTTP URL反推
  if (fileUrl.value && fileUrl.value.includes('/_matrix/media/')) {
    const matches = fileUrl.value.match(/\/_matrix\/media\/v3\/download\/([^\/]+)\/(.+)/)
    if (matches) {
      return `mxc://${matches[1]}/${matches[2]}`
    }
  }

  return ''
})

// 判断是否为流式模式（根据 isStreaming 属性判断）
const isStreamMode = computed(() => {
  return props.isStreaming
})

// 判断是否为媒体消息（图片、文件、音视频）
const isMediaMessage = computed(() => ['m.image', 'm.file', 'm.audio', 'm.video'].includes(props.messageType || ''))

// 解析图片大小
const imageSize = computed(() => {
  if (props.messageType !== 'm.image') return undefined
  return props.messageInfo?.size
})

// 操作条下载按钮 - 统一调用独立模块
const onClickDownload = async () => {
  if (!isMediaMessage.value) return
  try {
    const urlCandidate = props.messageType === 'm.image' ? (imageUrl.value || props.messageInfo?.url) : (fileUrl.value || props.messageInfo?.url)
    const mxcCandidate = mxcUrl.value || props.messageInfo?.mxcUrl
    const encryptionInfo = props.messageInfo?.encryptionInfo
    const filename = (props.messageType === 'm.image' ? (props.messageInfo?.filename) : fileName.value) || props.messageInfo?.filename
    const mimetype = props.messageInfo?.mimetype

    await downloadMedia({
      url: urlCandidate || undefined,
      mxcUrl: mxcCandidate || undefined,
      encryptionInfo,
      filename: filename || undefined,
      mimetype: mimetype || undefined,
    })
  } catch (e) {
    console.error('[ActionBar] 下载失败:', e)
  }
}

// 获取发送者显示名称（优先使用displayName，否则使用用户名）
const getDisplayName = (sender: string) => {
  return resolveUserDisplayName({ matrixId: sender, matrixDisplayName: props.displayName || null })
}

// 获取发送者姓名（去掉服务器部分）
const getSenderName = (sender: string) => {
  return resolveUserDisplayName({ matrixId: sender, matrixDisplayName: null })
}

// 获取头像首字母
const getInitials = (sender: string) => {
  const name = getDisplayName(sender)
  return name.charAt(0).toUpperCase()
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 行级 Hover 时间戳使用的完整日期时间格式：YYYY年MM月DD日 HH:mm
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const formatFullDateTime = (timestamp: number) => {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  const h = pad2(d.getHours())
  const min = pad2(d.getMinutes())
  return `${y}年${m}月${day}日 ${h}:${min}`
}

// 不使用 TS 配置或映射函数，直接在模板中写死 aria 与 title

// 用 TS 类型约束 aria 与标题字典，保障键值正确
const ariaLabels: Record<MsgOperationType, string> = {
  reply: 'reply',
  download: 'download',
  transcribe: 'transcribe',
  edit: 'edit',
  forward: 'forward',
  delete: 'delete',
  viewSource: 'viewSource',
}

const titles: Record<MsgOperationType, string> = {
  reply: '回复',
  download: '下载',
  transcribe: '音频转录',
  edit: '编辑',
  forward: '转发',
  delete: '删除',
  viewSource: '查看源码',
}


interface DeleteUiState {
  loading: boolean
  canDelete: boolean
  reason?: string
  mode?: DeleteMode
}

const deleteState = ref<DeleteUiState>({
  loading: true,
  canDelete: false,
  reason: '检查撤回权限...'
})
const deleteProcessing = ref(false)
let eligibilityToken = 0

const refreshDeleteEligibility = async () => {
  if (!props.roomId || !props.eventId) {
    deleteState.value = {
      loading: false,
      canDelete: false,
      reason: '缺少房间或消息信息'
    }
    return
  }
  const currentToken = ++eligibilityToken
  deleteState.value = {
    ...deleteState.value,
    loading: true
  }
  try {
    const result = await checkDeleteEligibility(props.roomId, props.eventId)
    if (currentToken !== eligibilityToken) return
    deleteState.value = {
      loading: false,
      canDelete: result.canDelete,
      reason: result.reason,
      mode: result.mode
    }
  } catch (err) {
    if (currentToken !== eligibilityToken) return
    deleteState.value = {
      loading: false,
      canDelete: false,
      reason: (err as Error)?.message || '撤回权限检查失败'
    }
  }
}

watch(() => [props.roomId, props.eventId, props.currentUserId], () => {
  refreshDeleteEligibility()
}, { immediate: true })

const deleteTooltip = computed(() => {
  if (deleteProcessing.value) return '正在撤回...'
  if (deleteState.value.loading) return '检查撤回权限...'
  if (deleteState.value.canDelete) {
    return deleteState.value.mode === 'admin' ? '管理员撤回' : '撤回'
  }
  return deleteState.value.reason || titles.delete
})

const deleteAriaLabel = computed(() => deleteTooltip.value || titles.delete)

const isDeleteDisabled = computed(() => deleteState.value.loading || deleteProcessing.value || !deleteState.value.canDelete)

const runConfirmation = async (mode: DeleteMode | undefined) => {
  const message = mode === 'admin'
    ? '确认以管理员身份撤回这条消息？'
    : '确认撤回这条消息？（仅支持 2 分钟内）'
  return openConfirmDialog(message, {
    title: '确认撤回',
    confirmText: '撤回',
    cancelText: '取消',
  })
}

const notifyError = (message: string) => {
  try {
    openMessageDialog(message)
  } catch {
    console.error(message)
  }
}

const handleDeleteClick = async () => {
  if (isDeleteDisabled.value) return
  if (!props.roomId || !props.eventId) return
  if (!await runConfirmation(deleteState.value.mode)) return

  deleteProcessing.value = true
  try {
    await deleteMessage(props.roomId, props.eventId)
    deleteState.value = {
      loading: false,
      canDelete: false,
      reason: '已发起撤回',
      mode: deleteState.value.mode
    }
    await chatContext?.refreshRoomData?.()
  } catch (err) {
    const msg = err instanceof Error ? err.message : '撤回失败'
    notifyError(`撤回失败：${msg}`)
    await refreshDeleteEligibility()
  } finally {
    deleteProcessing.value = false
  }
}



// 查看源码：弹窗开关
const showViewSource = ref(false)
const onClickViewSource = () => {
  showViewSource.value = true
}

// ========== Reply preview (single layer) ==========
type ReplyPreviewModel = import('@/services/Operations/MsgReply').ReplyPreviewModel
const replyPreview = ref<ReplyPreviewModel | null>(null)
const replyBadgeLabel = computed(() => {
  const t = replyPreview.value?.msgtype
  switch (t) {
    case 'm.image': return '图片'
    case 'm.audio': return '音频'
    case 'm.video': return '视频'
    case 'm.file': return '文件'
    default: return ''
  }
})

const ensureChildEvent = async () => {
  const client = matrixClientV2.getAuthedClient()
  if (!client || !props.roomId || !props.eventId) return null
  const room = client.getRoom(props.roomId)
  if (!room) return null
  let ev = room.findEventById(props.eventId) || null
  if (!ev) {
    try {
      await client.getEventTimeline(room.getUnfilteredTimelineSet(), props.eventId)
      ev = room.findEventById(props.eventId) || null
    } catch {
      ev = null
    }
  }
  return ev
}

onMounted(async () => {
  try {
    const ev = await ensureChildEvent()
    if (!ev) return
    const preview = await buildReplyPreviewFromChild(matrixClientV2.getAuthedClient()!, ev)
    replyPreview.value = preview
  } catch (e) {
    // 静默失败：没有父消息或无法解析
  }
})

const onClickReplyPreview = () => {
  const id = replyPreview.value?.parentEventId
  if (!id) return
  const cssEsc: any = (window as any).CSS?.escape
  const safeId = typeof cssEsc === 'function' ? cssEsc(id) : id.replace(/"/g, '\\"')
  const target = document.querySelector(`[data-event-id="${safeId}"]`)
  if (target instanceof HTMLElement) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.classList.add('reply-highlight')
    setTimeout(() => target.classList.remove('reply-highlight'), 1300)
  }
}


</script>
<style scoped>
/* 操作条与图标的基础样式（不改变位置，仅保证可见与对齐） */
.operations {
  display: flex;
  gap: 6px;
  align-items: center;
  /* 仅在 hover 时显示，且视觉上抬到消息气泡顶部外侧（不改左右逻辑） */
  transform: translateY(-32px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 120ms ease, visibility 120ms ease, transform 120ms ease;
  position: relative;
  /* 形成局部堆叠上下文，避免被相邻行覆盖 */
  z-index: 3;
  background-color: var(--bg-color-third);
  border-radius: 10px;
  border: 2px solid var(--tile-hover-line);

}

.mx_MessageActionBar_iconButton {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  /* 用于定位自定义 tooltip */
}

.mx_MessageActionBar_iconButton.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mx_MessageActionBar_iconButton.is-disabled:hover,
.mx_MessageActionBar_iconButton.is-disabled:focus-visible {
  background: transparent;
}

.mx_MessageActionBar_iconButton:hover,
.mx_MessageActionBar_iconButton:focus-visible {
  background: var(--opbar-hover-bg, var(--bg-color-active));
}

.mx_MessageActionBar_iconImg {
  /* 使用内联 SVG 时隐藏旧的 <img>，避免重复显示 */
  display: none;
}

/* 自定义 Tooltip（默认无边框，如需边框可覆盖 --tooltip-border 变量） */
.mx_MessageActionBar_iconButton::after {
  content: attr(data-tooltip);
  position: absolute;
  top: -32px;
  /* 显示在图标上方 */
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color-fifth);
  color: var(--color-white);
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 120ms ease, visibility 120ms ease, transform 120ms ease;
  z-index: 5;
  pointer-events: none;
  border: var(--tooltip-border, 0);
}

.mx_MessageActionBar_iconButton:hover::after,
.mx_MessageActionBar_iconButton:focus-visible::after {
  opacity: 1;
  visibility: visible;
}

/* Tooltip 小箭头，可按需调整/移除 */
.mx_MessageActionBar_iconButton::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--tooltip-bg, var(--color-primary));
  opacity: 0;
  visibility: hidden;
  transition: opacity 120ms ease, visibility 120ms ease;
  z-index: 5;
  pointer-events: none;
}

.mx_MessageActionBar_iconButton:hover::before,
.mx_MessageActionBar_iconButton:focus-visible::before {
  opacity: 1;
  visibility: visible;
}

/* 内联 SVG 主题化与尺寸统一 */
.operations .icon {
  width: 18px;
  height: 18px;
  display: block;
  color: var(--icon-color, var(--text-color));
}

.operations .icon path,
.operations .icon circle,
.operations .icon rect,
.operations .icon polygon,
.operations .icon polyline,
.operations .icon line {
  fill: currentColor !important;
  stroke: currentColor !important;
}

.mx_MessageActionBar_iconButton:hover .icon,
.mx_MessageActionBar_iconButton:focus-visible .icon {
  color: var(--icon-color-hover, var(--color-primary));
}

/* 在行 hover/focus 内显示操作条，并确保移入条本身不消失 */
.message-item:hover .operations,
.message-item:focus-within .operations,
.operations:hover {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

/* 主消息容器 */
.message-item {
  display: flex;
  gap: 8px;
  /* 从12px缩小到8px */
  padding: 4px 6px;
  /* 从6px 12px缩小到4px 6px */

  /* 从6px缩小到4px */
  align-items: flex-start;
  transition: background-color 0.2s ease;
  position: relative;
  /* 用于定位行级 hover 时间戳 */

  /* 行高亮的默认颜色（可在主题里覆盖） */
  --tile-hover-line: var(--bg-color-hover);
}



/* 行布局背景高亮：hover / focus-within 时整行变浅 */
.message-item:hover,
.message-item:focus-within {
  background-color: var(--tile-hover-line);
  border-radius: 8px;
  /* 抬高当前行，避免与上下相邻行遮挡 */
  z-index: 10;
}

/* 行级 Hover 时间戳（属于 message，而非气泡） */
.message-item::after {
  content: attr(data-time);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-color-secondary);
  opacity: 0;
  transition: opacity 120ms ease;
  pointer-events: none;
  white-space: nowrap;
  z-index: 2;
}

.message-item:hover::after,
.message-item:focus-within::after {
  opacity: 1;
}

/* 左右镜像放置：对方消息出现在右侧；自己消息出现在左侧 */
.message-item:not(.own-message)::after {
  right: 8px;
}

.message-item.own-message::after {
  left: 8px;
}

/* 右侧消息主容器 */
.message-item.own-message {
  flex-direction: row-reverse;
}

/* 右侧头像容器 */
.right-avatar-container {
  flex-shrink: 0;
  margin-top: 2px;
}

/* 右侧头像 */
.right-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--bg-color-fourth);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  object-fit: cover;
}

/* 右侧消息内容容器 */
.right-message-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  align-items: flex-end;

}

/* 右侧消息头部 */
.right-message-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 3px;
  flex-direction: row-reverse;
  justify-content: flex-start;
  width: 100%;
  max-width: 60%;
  min-width: 100px;
}

/* 右侧发送者姓名 */
.right-sender-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.right-sender-name:hover {
  color: var(--color-primary);
}

/* 右侧消息时间 */
.right-message-time {
  font-size: 11px;
  color: var(--text-color-secondary);
  font-weight: 200;
}

/* 右侧消息主体 */
.right-message-body {
  background-color: var(--bg-color-fifth);
  border-radius: 12px;
  padding: 8px 12px;
  color: var(--text-color);
  text-align: left;
  /* 改为左对齐，更美观 */
  word-break: break-word;
  max-width: 80%;
  min-width: 240px;
  width: fit-content;
  align-self: flex-end;
}

.right-message-body.media-message {
  padding: 0px;
  overflow: visible;
  background-color: var(--bg-color-fifth);
}

/* 右侧纯文本消息容器 */
.right-text-message {
  margin: 0;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.375;
  color: var(--text-color);
  text-align: left;
  white-space: pre-wrap;
  /* 改为左对齐 */
}

/* 右侧纯文本消息段落 */
.right-text-message p {
  margin: 0;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.375;
  color: var(--text-color);
  text-align: left;
  white-space: inherit;
  /* 改为左对齐 */
}

/* 左侧头像容器 */
.left-avatar-container {
  flex-shrink: 0;
  margin-top: 2px;
}

/* 左侧头像 */
.left-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--bg-color-fourth);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  object-fit: cover;
}

/* 左侧消息内容容器 */
.left-message-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  align-items: flex-start;

}

/* 左侧消息头部 */
.left-message-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 3px;
  width: 100%;
  max-width: 60%;
  min-width: 100px;
}

/* 左侧发送者姓名 */
.left-sender-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.left-sender-name:hover {
  color: var(--color-primary);
}

/* 左侧消息时间 */
.left-message-time {
  font-size: 11px;
  color: var(--text-color-secondary);
  font-weight: 200;
}

/* 左侧消息主体 */
.left-message-body {
  background-color: var(--bg-color-third);
  border-radius: 12px;
  padding: 4px 6px;
  color: var(--text-color);
  text-align: left;
  word-break: break-word;
  max-width: 80%;
  min-width: 500px;
  width: fit-content;
  align-self: flex-start;
}

.left-message-body.media-message {
  padding: 6px;
  overflow: visible;
  background-color: var(--bg-color-third);
}

.right-message-body.media-message :deep(.message-pic),
.left-message-body.media-message :deep(.message-pic),
.right-message-body.media-message :deep(.message-file),
.left-message-body.media-message :deep(.message-file) {
  margin: 0;
  width: 100%;
  display: block;
}

.right-message-body.media-message :deep(.message-pic .image-container),
.left-message-body.media-message :deep(.message-pic .image-container) {
  width: 100%;
  display: block;
}

.right-message-body.media-message :deep(.message-pic .message-image),
.left-message-body.media-message :deep(.message-pic .message-image) {
  width: 100%;
  max-width: none;
  border-radius: 0;
}

.right-message-body.media-message :deep(.message-file .file-container),
.left-message-body.media-message :deep(.message-file .file-container) {
  border-radius: 0;
}

/* 左侧纯文本消息容器 */
.left-text-message {
  margin: 0;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.375;
  color: var(--text-color);
  text-align: left;
  white-space: pre-wrap;
}

/* 左侧纯文本消息段落 */
.left-text-message p {
  margin: 0;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.375;
  color: var(--text-color);
  text-align: left;
  white-space: inherit;
}

@media (max-width: 768px) {
  .message-item {
    padding: 6px 10px;
    gap: 6px;
  }

  .right-message-content,
  .left-message-content {
    max-width: 100%;
    min-width: 0;
  }

  .right-message-header,
  .left-message-header {
    max-width: 100%;
    min-width: 0;
  }

  .right-message-body,
  .left-message-body {
    max-width: 92vw;
    min-width: 0;
    width: fit-content;
  }

  .right-text-message,
  .left-text-message {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .right-message-time,
  .left-message-time {
    display: none;
  }

  .operations {
    position: absolute;
    top: 4px;
    right: 6px;
    transform: none;
  }

  .message-item.own-message .operations {
    right: auto;
    left: 6px;
  }
}

/* 连续消息左侧内容对齐 */
.message-item.continued-in-group .left-message-content {
  margin-left: 40px;
  /* 头像32px + gap8px = 40px */
  /* margin-top: -12px;  */
  margin-top: -5.5px;
  /* 稍微减少上边距，让连续消息更紧凑 */
  align-items: flex-start;
}

/* 连续消息右侧内容对齐 */
.message-item.own-message.continued-in-group .right-message-content {
  margin-right: 40px;
  /* 头像32px + gap8px = 40px，向右偏移对齐 */
  /* margin-top: -12px;  */
  margin-top: -5.5px;
  /* 稍微减少上边距，让连续消息更紧凑 */
  align-items: flex-end;
}

/* 链接样式 */
.message-body a {
  color: var(--color-primary);
  text-decoration: none;
}

.message-body a:hover {
  text-decoration: underline;
}

/* 代码块样式 */
.message-body code {
  background-color: var(--code-bg);
  color: var(--text-color);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  word-break: break-all;
}

.message-body pre {
  background-color: var(--code-bg);
  color: var(--text-color);
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid var(--border-color);
  margin: 8px 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 引用样式 */
.message-body blockquote {
  border-left: 4px solid var(--border-color);
  margin: 8px 0;
  padding-left: 12px;
  color: var(--text-color-secondary);
}

/* Emoji样式 */
.message-body .emoji {
  width: 22px;
  height: 22px;
  vertical-align: middle;
}

/* 提及样式 */
.message-body .mention {
  background-color: var(--color-primary-bg, rgba(88, 101, 242, 0.15));
  color: var(--color-primary-text, #5865f2);
  padding: 0 2px;
  border-radius: 3px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.message-body .mention:hover {
  background-color: var(--color-primary);
  color: var(--text-color);
}

/* ====== Reply preview (single layer) ====== */
.reply-preview {
  border-left: 3px solid var(--border-color, rgba(255, 255, 255, 0.15));
  background: var(--bg-color-third);
  padding: 6px 8px;
  margin: 2px 0 6px 0;
  border-radius: 6px;
  max-width: 80%;
  min-width: 240px;
  cursor: pointer;
}

.reply-header {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 2px;
}

.reply-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 16px;
  border-radius: 3px;
  background: var(--bg-color-fourth);
  color: var(--text-color);
}

.reply-sender {
  font-weight: 600;
}

.reply-summary {
  font-size: 13px;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reply-highlight {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  transition: outline-color 0.3s ease;
}
</style>

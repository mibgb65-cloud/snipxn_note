<template>
  <Dialog
    :visible="visible"
    modal
    :header="t('community.sharePost')"
    :style="{ width: '28rem' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="share-dialog-loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem" />
    </div>

    <div v-else-if="shareToken" class="share-dialog-body">
      <!-- URL -->
      <label class="share-dialog-label">{{ t('community.sharePublicHint') }}</label>
      <div class="share-dialog-url-row">
        <InputText :model-value="shareUrl" readonly class="share-dialog-url-input" />
        <Button
          icon="pi pi-copy"
          severity="secondary"
          outlined
          @click="copyUrl"
        />
      </div>

      <!-- QR Code -->
      <div v-if="qrDataUrl" class="share-dialog-qr">
        <img :src="qrDataUrl" alt="QR Code" class="share-dialog-qr-img" />
      </div>

      <!-- Cancel Share -->
      <div class="share-dialog-footer">
        <Button
          :label="t('community.cancelShare')"
          severity="danger"
          text
          size="small"
          icon="pi pi-times"
          @click="handleCancelShare"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useCommunityStore } from '../../stores/community';
import QRCode from 'qrcode';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps({
  visible: Boolean,
  postId: String,
});

const emit = defineEmits(['update:visible']);

const { t } = useI18n();
const toast = useToast();
const communityStore = useCommunityStore();

const loading = ref(false);
const shareToken = ref(null);
const shareUrl = ref('');
const qrDataUrl = ref('');

function buildShareUrl(token) {
  return `${window.location.origin}/share/post/${token}`;
}

watch(() => props.visible, async (val) => {
  if (!val || !props.postId) return;

  loading.value = true;
  shareToken.value = null;
  qrDataUrl.value = '';

  try {
    const token = await communityStore.sharePost(props.postId);
    shareToken.value = token;
    shareUrl.value = buildShareUrl(token);
    qrDataUrl.value = await QRCode.toDataURL(shareUrl.value, { width: 200, margin: 2 });
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('community.loadFailed'), life: 3000 });
    emit('update:visible', false);
  } finally {
    loading.value = false;
  }
});

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('community.shareUrlCopied'), life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: 'Copy failed', life: 2000 });
  }
}

async function handleCancelShare() {
  try {
    await communityStore.cancelPostShare(props.postId);
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('community.shareCancelSuccess'), life: 2000 });
    shareToken.value = null;
    emit('update:visible', false);
  } catch (err) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: err.message, life: 3000 });
  }
}
</script>

<style scoped>
.share-dialog-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.share-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.share-dialog-label {
  font-size: 0.82rem;
  color: var(--text-color-secondary);
}

.share-dialog-url-row {
  display: flex;
  gap: 0.5rem;
}

.share-dialog-url-input {
  flex: 1;
  font-size: 0.82rem;
}

.share-dialog-qr {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.share-dialog-qr-img {
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);
}

.share-dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 0.25rem;
  border-top: 1px solid var(--surface-border);
}
</style>

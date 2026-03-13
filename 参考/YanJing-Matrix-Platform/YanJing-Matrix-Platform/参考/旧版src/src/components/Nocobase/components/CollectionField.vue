<template>
  <div class="nocobase-collection-field">
    <template v-if="isAssociation">
      <template v-if="Array.isArray(associationData)">
        <span v-for="(item, index) in associationData" :key="index">
          {{ getLabel(item) }}
          <span v-if="index < associationData.length - 1">, </span>
        </span>
      </template>
      <template v-else-if="associationData">
        {{ getLabel(associationData) }}
      </template>
    </template>
    <template v-else>
      {{ formattedValue }}
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { t } from '../utils/translate';

const props = defineProps<{
  schema: any;
  data: any;
}>();

const fieldPath = computed(() => props.schema['x-collection-field']);

const rawValue = computed(() => {
  if (!fieldPath.value) return undefined;
  
  const parts = fieldPath.value.split('.');
  let val = props.data;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (val === null || val === undefined) break;

    if (Array.isArray(val)) {
      // If we encounter an array in the middle of a path, we map the rest of the path
      return val.map(item => {
        let subVal = item;
        for (let j = i; j < parts.length; j++) {
          subVal = subVal?.[parts[j]];
        }
        return subVal;
      });
    }

    if (typeof val === 'object') {
      if (val[part] !== undefined) {
        val = val[part];
      } else if (i === 0) {
        // Skip collection name prefix if it doesn't match
        continue;
      } else {
        val = undefined;
        break;
      }
    } else {
      val = undefined;
      break;
    }
  }
  return val;
});

const isAssociation = computed(() => {
  // If x-component is AssociationField or similar, or if we have fieldNames
  const component = props.schema['x-component'];
  return component === 'AssociationField' || 
         props.schema['x-component-props']?.fieldNames !== undefined ||
         (rawValue.value && typeof rawValue.value === 'object');
});

const fieldNames = computed(() => props.schema['x-component-props']?.fieldNames);

const getLabel = (item: any) => {
  if (!item) return '';
  if (typeof item !== 'object') return t(String(item));
  
  const labelKey = fieldNames.value?.label || 'name';
  const val = item[labelKey] || item.name || item.nickname || item.label;
  return val ? t(String(val)) : JSON.stringify(item);
};

const associationData = computed(() => rawValue.value);

const formattedValue = computed(() => {
  const val = rawValue.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return t(String(val));
});
</script>

<style scoped>
.nocobase-collection-field {
  display: inline-block;
}
</style>

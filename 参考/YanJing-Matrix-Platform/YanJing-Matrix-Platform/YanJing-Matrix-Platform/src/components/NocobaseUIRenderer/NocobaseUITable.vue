<template>
    <div class="nocobase-ui-table">
        <table>
            <thead>
                <tr>
                    <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, index) in rows" :key="index">
                    <td v-for="column in columns" :key="column.key">{{ row[column.key] }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    columns?: Array<{ key: string; label: string }>
    rows?: Array<Record<string, unknown>>
}>()
</script>

<style scoped>
.nocobase-ui-table table {
    width: 100%;
    border-collapse: collapse;
}

.nocobase-ui-table th,
.nocobase-ui-table td {
    border: var(--glass-border);
    padding: var(--space-sm) var(--space-md);
    text-align: left;
    color: var(--text-color);
    font-size: var(--font-base);
}
</style>

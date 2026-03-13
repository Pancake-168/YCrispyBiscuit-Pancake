import type { Component } from 'vue'

import NocobaseUIGrid from '@/components/NocobaseUIRenderer/NocobaseUIGrid.vue'
import NocobaseUIGridRow from '@/components/NocobaseUIRenderer/NocobaseUIGridRow.vue'
import NocobaseUIGridCol from '@/components/NocobaseUIRenderer/NocobaseUIGridCol.vue'
import NocobaseUIFormV2 from '@/components/NocobaseUIRenderer/NocobaseUIFormV2.vue'
import NocobaseUICollectionField from '@/components/NocobaseUIRenderer/NocobaseUICollectionField.vue'
import NocobaseUIAction from '@/components/NocobaseUIRenderer/NocobaseUIAction.vue'
import NocobaseUIActionDrawerFootBar from '@/components/NocobaseUIRenderer/NocobaseUIActionDrawerFootBar.vue'
import NocobaseUIFlowRoute from '@/components/NocobaseUIRenderer/NocobaseUIFlowRoute.vue'
import NocobaseUIUnknown from '@/components/NocobaseUIRenderer/NocobaseUIUnknown.vue'
import NocobaseUIInput from '@/components/NocobaseUIRenderer/NocobaseUIInput.vue'
import NocobaseUISelect from '@/components/NocobaseUIRenderer/NocobaseUISelect.vue'
import NocobaseUIDatePicker from '@/components/NocobaseUIRenderer/NocobaseUIDatePicker.vue'
import NocobaseUICheckbox from '@/components/NocobaseUIRenderer/NocobaseUICheckbox.vue'
import NocobaseUIUpload from '@/components/NocobaseUIRenderer/NocobaseUIUpload.vue'
import NocobaseUITable from '@/components/NocobaseUIRenderer/NocobaseUITable.vue'
import NocobaseUIPassword from '@/components/NocobaseUIRenderer/NocobaseUIPassword.vue'
import NocobaseUITextArea from '@/components/NocobaseUIRenderer/NocobaseUITextArea.vue'
import NocobaseUIFormBlockProvider from '@/components/NocobaseUIRenderer/NocobaseUIFormBlockProvider.vue'
import NocobaseUIFormItem from '@/components/NocobaseUIRenderer/NocobaseUIFormItem.vue'

export type NocobaseUIComponentRegistry = Record<string, Component>

export const nocobaseUIComponentRegistry: NocobaseUIComponentRegistry = {
    Grid: NocobaseUIGrid,
    'Grid.Row': NocobaseUIGridRow,
    'Grid.Col': NocobaseUIGridCol,
    FormV2: NocobaseUIFormV2,
    CollectionField: NocobaseUICollectionField,
    Action: NocobaseUIAction,
    'Action.Drawer.FootBar': NocobaseUIActionDrawerFootBar,
    FlowRoute: NocobaseUIFlowRoute,
    Input: NocobaseUIInput,
    Select: NocobaseUISelect,
    DatePicker: NocobaseUIDatePicker,
    Checkbox: NocobaseUICheckbox,
    Upload: NocobaseUIUpload,
    Table: NocobaseUITable,
    Password: NocobaseUIPassword,
    TextArea: NocobaseUITextArea,
    FormBlockProvider: NocobaseUIFormBlockProvider,
    FormItem: NocobaseUIFormItem,
}

export const getNocobaseUIComponent = (name?: string): Component => {
    if (!name) {
        return NocobaseUIUnknown
    }
    return nocobaseUIComponentRegistry[name] ?? NocobaseUIUnknown
}

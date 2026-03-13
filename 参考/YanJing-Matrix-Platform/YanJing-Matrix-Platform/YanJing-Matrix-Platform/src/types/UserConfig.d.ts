export type UserTheme = 'light' | 'dark' 
export type FunctionListMode = 'drawer' | 'fixed'

export interface UserConfig {
	theme?: UserTheme
    language?: string
	currentOrg?: string
	functionListMode?: FunctionListMode
	functionListCollapsed?: boolean
	notificationSoundEnabled?: boolean

}

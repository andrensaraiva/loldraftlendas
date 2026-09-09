/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly DEV: boolean;
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_ADMIN_DEMO_MODE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_DISCORD_INVITE?: string;
  readonly PUBLIC_METRIKA_ID?: string;
  readonly ADMIN_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

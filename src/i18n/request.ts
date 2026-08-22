import { getRequestConfig } from "next-intl/server";

// Phase 0〜1 は英語のみ。Phase 2 で中国語を追加する際はここに locale 判定を足す。
const locale = "en";

export default getRequestConfig(async () => ({
  locale,
  messages: (await import(`./messages/${locale}.json`)).default,
}));

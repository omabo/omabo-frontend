import { cn } from "@/lib/utils";
import type { SourceChannel } from "@/lib/admin/mock-store";

const CHANNEL_COLOR: Record<SourceChannel, string> = {
  web: "bg-primary",
  phone: "bg-blue-500",
  ota: "bg-violet-500",
  "walk-in": "bg-emerald-500",
};

export const CHANNEL_LABEL: Record<SourceChannel, string> = {
  web: "Web予約",
  phone: "電話",
  ota: "OTA",
  "walk-in": "ウォークイン",
};

export function ChannelDot({ channel, className }: { channel: SourceChannel; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", CHANNEL_COLOR[channel], className)} />;
}

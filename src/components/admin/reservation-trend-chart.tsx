import { dayOfMonth, formatFullDateLabel } from "@/lib/admin/date-utils";

const TICK_COUNT = 4;

function monthOf(dateStr: string): number {
  return Number(dateStr.slice(5, 7));
}

// 月をまたぐ範囲でも軸から月がわかるよう、先頭と月の変わり目だけ "M/D"、
// それ以外は日にちだけを表示する(カレンダーUIの一般的な慣習に合わせる)。
function axisLabel(dateStr: string, index: number, data: { date: string }[]): string {
  const showMonth = index === 0 || monthOf(dateStr) !== monthOf(data[index - 1].date);
  return showMonth ? `${monthOf(dateStr)}/${dayOfMonth(dateStr)}` : String(dayOfMonth(dateStr));
}

export function ReservationTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const step = Math.max(1, Math.ceil(max / TICK_COUNT));
  const axisMax = step * TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => axisMax - i * step);

  return (
    <div className="flex gap-2">
      <div className="flex h-32 flex-col justify-between text-right text-[10px] tabular-nums text-muted-foreground">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="flex-1">
        <div className="relative h-32">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-border/60" style={{ bottom: `${(t / axisMax) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex gap-1">
            {data.map((d) => (
              <div
                key={d.date}
                className="flex h-32 flex-1 flex-col items-center justify-end"
                title={`${formatFullDateLabel(d.date)}: ${d.count}件`}
              >
                <div
                  className="w-full rounded-t-sm bg-primary/70"
                  style={{ height: d.count === 0 ? "2px" : `${(d.count / axisMax) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          {data.map((d, i) => (
            <span key={d.date} className="flex-1 text-center text-[10px] tabular-nums text-muted-foreground">
              {axisLabel(d.date, i, data)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

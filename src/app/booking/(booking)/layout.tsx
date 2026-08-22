import { Fraunces } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { BookingFlowProvider } from "@/lib/booking/flow-context";

import "@/app/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-heading",
  display: "swap",
});

export default async function BookingLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={fraunces.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BookingFlowProvider>{children}</BookingFlowProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

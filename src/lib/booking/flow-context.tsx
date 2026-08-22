"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface HoldState {
  holdId: string;
  holdExpiresAt: number;
}

interface BookingFlowContextValue {
  guestInfo: GuestInfo | null;
  setGuestInfo: (info: GuestInfo) => void;
  hold: HoldState | null;
  startHold: (hold: HoldState) => void;
  clearHold: () => void;
  holdExpired: boolean;
  acknowledgeExpiry: () => void;
  msRemaining: number | null;
}

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

/**
 * Lives in the (booking) layout so it survives client-side navigation between
 * steps. Guest info and the hold are kept in memory only — never in the URL
 * or localStorage — so a reload mid-flow loses them by design, same as the
 * hold itself lapsing.
 */
export function BookingFlowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [guestInfo, setGuestInfoState] = useState<GuestInfo | null>(null);
  const [hold, setHold] = useState<HoldState | null>(null);
  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);

  useEffect(() => {
    if (!hold) {
      setMsRemaining(null);
      return;
    }

    const tick = () => {
      const remaining = hold.holdExpiresAt - Date.now();
      setMsRemaining(Math.max(0, remaining));
      if (remaining <= 0) {
        setHold(null);
        setGuestInfoState(null);
        setHoldExpired(true);
        router.push("/date");
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hold, router]);

  const setGuestInfo = useCallback((info: GuestInfo) => setGuestInfoState(info), []);

  const startHold = useCallback((next: HoldState) => {
    setHoldExpired(false);
    setHold(next);
  }, []);

  const clearHold = useCallback(() => {
    setHold(null);
    setMsRemaining(null);
  }, []);

  const acknowledgeExpiry = useCallback(() => setHoldExpired(false), []);

  const value = useMemo<BookingFlowContextValue>(
    () => ({ guestInfo, setGuestInfo, hold, startHold, clearHold, holdExpired, acknowledgeExpiry, msRemaining }),
    [guestInfo, setGuestInfo, hold, startHold, clearHold, holdExpired, acknowledgeExpiry, msRemaining]
  );

  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>;
}

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) {
    throw new Error("useBookingFlow must be used within BookingFlowProvider");
  }
  return ctx;
}

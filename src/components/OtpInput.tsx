"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Fragment, useEffect, useRef } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/shadcn/ui/input-otp";
import { cn } from "@/shadcn/utils";
import { shakeElement } from "@/utils/shake";

// the code from an sms on chrome for android, if the message ends with
// "@your-domain #123456". nothing happens anywhere else, and the user can
// always type or paste
function useReadSmsCode(onCode: (code: string) => void) {
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!("OTPCredential" in window)) return;
    const abort = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: abort.signal })
      .then((credential) => {
        if (credential && "code" in credential)
          onCodeRef.current(String(credential.code));
      })
      .catch(() => {});
    return () => abort.abort();
  }, []);
}

// verification code boxes: paste a whole code, the phone offers the one from
// your sms above the keyboard (autocomplete), backspace walks back. group
// the digits in threes. when isInvalid flips on the boxes shake
export function OtpInput({
  value,
  onValueChange,
  onComplete,
  length = 6,
  isInvalid = false,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  isInvalid?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useReadSmsCode(onValueChange);

  useEffect(() => {
    if (isInvalid) shakeElement(containerRef.current);
  }, [isInvalid]);

  const slotGroups = Array.from({ length: Math.ceil(length / 3) }, (_, group) =>
    Array.from(
      { length: Math.min(3, length - group * 3) },
      (_, slot) => group * 3 + slot,
    ),
  );

  return (
    <div ref={containerRef} className={cn("w-fit", className)}>
      <InputOTP
        maxLength={length}
        pattern={REGEXP_ONLY_DIGITS}
        autoComplete="one-time-code"
        {...{ value, onComplete }}
        onChange={onValueChange}
        aria-invalid={isInvalid}
      >
        {slotGroups.map((slots, group) => (
          // groups never reorder, the index is the identity
          // biome-ignore lint/suspicious/noArrayIndexKey: static layout
          <Fragment key={group}>
            {group > 0 && <InputOTPSeparator />}
            <InputOTPGroup>
              {slots.map((index) => (
                <InputOTPSlot
                  key={index}
                  {...{ index }}
                  aria-invalid={isInvalid}
                  className="size-11 text-lg"
                />
              ))}
            </InputOTPGroup>
          </Fragment>
        ))}
      </InputOTP>
    </div>
  );
}

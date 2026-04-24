"use client";

import { useEffect, useRef } from "react";

interface AutoSubmitFormProps {
  action: (formData: FormData) => void | Promise<void>;
}

export function AutoSubmitForm({ action }: AutoSubmitFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form
      ref={formRef}
      action={action}
      className="w-full max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-6 text-center shadow-[var(--shadow-soft)]"
    >
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Admin 인증 중</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Google 계정 인증 화면으로 자동 이동합니다.
      </p>
      <button
        type="submit"
        className="mt-6 inline-flex rounded-lg bg-[var(--accent-green)] px-4 py-2 text-sm font-medium text-[var(--text-inverse)] hover:bg-[var(--accent-green-strong)]"
      >
        이동이 안 되면 다시 시도
      </button>
    </form>
  );
}

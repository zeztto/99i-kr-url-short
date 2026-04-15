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
      className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/80 p-6 text-center shadow-2xl shadow-black/20"
    >
      <h1 className="text-xl font-semibold text-white">Admin 인증 중</h1>
      <p className="mt-3 text-sm text-gray-400">
        Google 계정 인증 화면으로 자동 이동합니다.
      </p>
      <button
        type="submit"
        className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900"
      >
        이동이 안 되면 다시 시도
      </button>
    </form>
  );
}

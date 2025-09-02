'use client';
import ResetPassword from './ResetPassword';
import React from 'react';

export default function ResetPasswordPage() {
  // Suspense는 Next.js에서 searchParams를 읽는 컴포넌트를 위한 권장사항입니다.
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ResetPassword />
    </React.Suspense>
  );
}

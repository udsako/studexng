// src/app/laundry/page.tsx - Redirect to dynamic category page
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function LaundryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/category/laundry');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center">
      <Loader className="w-12 h-12 text-purple-600 animate-spin" />
    </div>
  );
}

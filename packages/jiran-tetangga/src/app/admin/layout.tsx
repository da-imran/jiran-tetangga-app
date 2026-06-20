import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [, navigate] = useLocation();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
    } else {
      setIsVerified(true);
    }
  }, [navigate]);

  if (!isVerified) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-8">
        <div className="w-full space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

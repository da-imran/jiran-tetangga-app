import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useSearchParams, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Token is required.' }),
  newPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least 1 capital letter (A-Z)' })
    .regex(/[0-9]/, { message: 'Password must contain at least 1 number (0-9)' })
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, { message: 'Password must contain at least 1 symbol (e.g. ! @ # $ % ^ & *)' }),
  confirmPassword: z.string()
    .min(8, { message: 'Please confirm your new password' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Path of error
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get token from query params
  const token = searchParams.get('token') || '';

  const { register, handleSubmit, formState, reset } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
    // Custom validation for password match
    mode: 'onChange',
    criteriaMode: 'all',
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      // Only send newPassword to backend (not confirmPassword)
      const { confirmPassword, ...passwordData } = data;
      const response = await api.post('/reset-password', passwordData);

      if (response?.status === 200) {
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been reset successfully. You can now log in with your new password.',
        });
        // Clear form and redirect to login
        reset();
        navigate('/login');
      } else {
        // Handle backend error response
        const errorMessage = response?.message || 'Password reset failed.';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // Handle network/API errors
      const errorMessage = error?.message || 'Invalid or expired token. Please request a new reset link.';
      toast({
        variant: 'destructive',
        title: 'Password Reset Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute left-4 top-4">
        <Button asChild variant="outline">
          <Link href="/login" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <span>Back to Login</span>
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password to complete the reset process.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden token field - populated from URL params */}
            <input type="hidden" {...register('token')} />

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('newPassword')}
                  className="pr-10"
                />
                <Button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formState.errors.newPassword && <p className="text-sm text-destructive">{formState.errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Re-type New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="pr-10"
                />
                <Button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formState.errors.confirmPassword && <p className="text-sm text-destructive">{formState.errors.confirmPassword.message}</p>}
            </div>

            {/* Custom validation message for password mismatch */}
            {formState?.errors?.newPassword?.type === 'validate' && (
              <p className="text-sm text-destructive mt-1">
                Passwords do not match
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
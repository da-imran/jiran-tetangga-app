import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Mail } from 'lucide-react';
import { api } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/forgot-password', data);

      // Check if we got a dev link back (development/local environment)
      const devLinkFromApi = response?.devLink;

      setIsSubmitting(false);
      reset(); // Clear the form

      if (devLinkFromApi) {
        // Store the dev link to display in the UI for development/local environments
        setDevLink(devLinkFromApi);
      } else {
        // Show generic message in production to prevent email enumeration
        toast({
          title: 'Check your email',
          description: 'If the email exists, a reset link has been sent.',
        });
      }
    } catch (error) {
      // Ignore error - we still show success message to prevent email enumeration
      setIsSubmitting(false);
      reset(); // Clear the form
      toast({
        title: 'Check your email',
        description: 'If the email exists, a reset link has been sent.',
      });
    }
  };

  const handleCopyLink = () => {
    if (linkInputRef.current && devLink) {
      linkInputRef.current.select();
      navigator.clipboard.writeText(devLink).then(() => {
        toast({
          title: 'Link copied!',
          description: 'Reset link copied to clipboard',
        });
      });
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
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>

          {/* Display dev link in development/local environments */}
          {devLink && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Development Mode</h3>
                  <div className="mt-1">
                    <input
                      ref={linkInputRef}
                      type="text"
                      value={devLink}
                      readOnly
                      className="mt-1 block w-full break-all bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base"
                      onClick={handleCopyLink}
                    />
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    Click to copy link to clipboard
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
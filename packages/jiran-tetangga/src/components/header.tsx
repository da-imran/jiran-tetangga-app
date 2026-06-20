import { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { Home, LogIn, Wrench, LogOut, User, MapPin, Store, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IssueReportForm } from "./issue-report-form";
import { Badge } from "./ui/badge";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: "/",            label: "Dashboard",   icon: <Home className="h-4 w-4" /> },
  { href: "/map",         label: "Incident Map",icon: <MapPin className="h-4 w-4" /> },
  { href: "/marketplace", label: "Marketplace", icon: <Store className="h-4 w-4" /> },
  { href: "/lost-found",  label: "Lost & Found", icon: <Search className="h-4 w-4" /> },
];

export function AppHeader() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAdminLoggedIn(!!token);
  }, [location]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    setIsAdminLoggedIn(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/');
  };

  const isAdmin = location.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold shrink-0">
          <Home className="h-6 w-6 text-primary" />
          <span className="text-lg font-headline hidden sm:block">JiranTetangga</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                location === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {isAdminLoggedIn ? (
            <>
              {isAdmin ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/"><Home className="mr-1.5 h-4 w-4" />Dashboard</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin"><User className="mr-1.5 h-4 w-4" />Admin Panel</Link>
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>This action will end your current session.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Badge variant="outline" className="hidden font-semibold lg:block">Admin</Badge>
            </>
          ) : (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="hidden sm:inline-flex">
                    <Wrench className="mr-1.5 h-4 w-4" />
                    Report Issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle data-speakable="true">Submit an Issue Report</DialogTitle>
                    <DialogDescription data-speakable="true">
                      Let us know about any problems in the neighborhood.
                    </DialogDescription>
                  </DialogHeader>
                  <IssueReportForm />
                </DialogContent>
              </Dialog>
              <Button asChild size="sm" variant="outline">
                <Link href="/login"><LogIn className="mr-1.5 h-4 w-4" />Admin</Link>
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card px-4 py-3 space-y-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <Wrench className="mr-1.5 h-4 w-4" />
                  Report an Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Submit an Issue Report</DialogTitle>
                  <DialogDescription>Let us know about any problems in the neighborhood.</DialogDescription>
                </DialogHeader>
                <IssueReportForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </header>
  );
}

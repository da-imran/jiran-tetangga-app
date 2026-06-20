import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppHeader } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Store, BookOpen, Utensils, Wrench, PawPrint, Hammer, Briefcase,
  Phone, MapPin, Clock, PlusCircle, Tag, User, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type Category = "tuition" | "food" | "handyman" | "pet" | "tools" | "jobs";

interface Listing {
  id: string;
  category: Category;
  title: string;
  description: string;
  price: number;
  seller: string;
  location: string;
  contact: string;
  posted: string;
  tags: string[];
}

const CATEGORIES: Array<{ value: Category | "all"; label: string; icon: React.ReactNode }> = [
  { value: "all",      label: "All",        icon: <Store className="h-4 w-4" /> },
  { value: "tuition",  label: "Tuition",    icon: <BookOpen className="h-4 w-4" /> },
  { value: "food",     label: "Food",       icon: <Utensils className="h-4 w-4" /> },
  { value: "handyman", label: "Handyman",   icon: <Wrench className="h-4 w-4" /> },
  { value: "pet",      label: "Pet Care",   icon: <PawPrint className="h-4 w-4" /> },
  { value: "tools",    label: "Tools",      icon: <Hammer className="h-4 w-4" /> },
  { value: "jobs",     label: "Jobs",       icon: <Briefcase className="h-4 w-4" /> },
];

const CATEGORY_GRADIENT: Record<Category, string> = {
  tuition:  "from-blue-400 to-blue-600",
  food:     "from-orange-400 to-orange-600",
  handyman: "from-green-400 to-green-600",
  pet:      "from-pink-400 to-pink-600",
  tools:    "from-gray-400 to-gray-600",
  jobs:     "from-purple-400 to-purple-600",
};

const CATEGORY_ICON: Record<Category, React.ReactNode> = {
  tuition:  <BookOpen className="h-10 w-10 text-white" />,
  food:     <Utensils className="h-10 w-10 text-white" />,
  handyman: <Wrench className="h-10 w-10 text-white" />,
  pet:      <PawPrint className="h-10 w-10 text-white" />,
  tools:    <Hammer className="h-10 w-10 text-white" />,
  jobs:     <Briefcase className="h-10 w-10 text-white" />,
};

const CATEGORY_ICON_SM: Record<Category, React.ReactNode> = {
  tuition:  <BookOpen className="h-8 w-8 text-white" />,
  food:     <Utensils className="h-8 w-8 text-white" />,
  handyman: <Wrench className="h-8 w-8 text-white" />,
  pet:      <PawPrint className="h-8 w-8 text-white" />,
  tools:    <Hammer className="h-8 w-8 text-white" />,
  jobs:     <Briefcase className="h-8 w-8 text-white" />,
};

const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.enum(["tuition", "food", "handyman", "pet", "tools", "jobs"]),
  price: z.string().min(1, "Price is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  location: z.string().min(3, "Location is required"),
  contact: z.string().min(8, "Contact is required"),
});

type ListingForm = z.infer<typeof listingSchema>;

function ListingDetailDialog({
  listing,
  open,
  onClose,
}: {
  listing: Listing | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  if (!listing) return null;
  const catLabel = CATEGORIES.find(c => c.value === listing.category)?.label ?? listing.category;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className={cn("h-36 bg-gradient-to-br flex flex-col items-center justify-center gap-2 relative", CATEGORY_GRADIENT[listing.category])}>
          {CATEGORY_ICON[listing.category]}
          <span className="text-white/80 text-xs font-medium uppercase tracking-widest">{catLabel}</span>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold leading-snug">{listing.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary">{catLabel}</Badge>
              <div className="flex items-center gap-1 text-primary font-bold text-lg">
                <Tag className="h-4 w-4" />
                {typeof listing.price === 'number' ? `RM ${listing.price}` : listing.price}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="text-sm leading-relaxed">{listing.description}</p>
          </div>

          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.tags.map(t => (
                <span key={t} className="text-xs bg-muted rounded-full px-2.5 py-1 font-medium">{t}</span>
              ))}
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seller</p>
              <p className="flex items-center gap-1.5 font-medium"><User className="h-3.5 w-3.5 text-muted-foreground" />{listing.seller}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Posted</p>
              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" />{listing.posted}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{listing.location}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
              <p className="flex items-center gap-1.5 font-medium text-primary"><Phone className="h-3.5 w-3.5" />{listing.contact}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button
            className="flex-1"
            onClick={() => {
              toast({ title: "Contact details", description: `${listing.seller}: ${listing.contact}` });
              onClose();
            }}
          >
            <Phone className="mr-2 h-4 w-4" />
            Contact Seller
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [postOpen, setPostOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/listings');
      const formattedListings: Listing[] = (result.data || []).map((item: any) => ({
        id: item._id,
        category: (item.category || "other") as Category,
        title: item.title || "",
        description: item.description || "",
        price: item.price || 0,
        seller: item.seller || "Unknown",
        location: item.location || "",
        contact: item.contact || "",
        posted: formatPostedDate(item.createdAt),
        tags: item.tags || [],
      }));
      setListings(formattedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch listings.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filtered = useMemo(() => {
    let result = listings;
    if (activeCategory !== "all") result = result.filter(l => l.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.tags && l.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [listings, activeCategory, search]);

  const onSubmit = async (data: ListingForm) => {
    try {
      await api.post('/listings', data);
      toast({ title: "Listing posted!", description: "Your listing is now live on the marketplace." });
      reset();
      setPostOpen(false);
      fetchListings();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to post listing.', description: error.message });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              Community Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Buy, sell, and discover services from your neighbours.</p>
          </div>
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Post a Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Post a Listing</DialogTitle>
                <DialogDescription>Share what you're selling, offering, or looking for.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={v => setValue("category", v as Category)}>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.value !== "all").map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="e.g. Home-cooked meals for delivery" {...register("title")} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input placeholder="e.g. RM 50/day" {...register("price")} />
                    {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input placeholder="e.g. SS2, PJ" {...register("location")} />
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe your listing in detail..." rows={3} {...register("description")} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contact (Phone / WhatsApp)</Label>
                  <Input placeholder="e.g. 012-3456-7890" {...register("contact")} />
                  {errors.contact && <p className="text-xs text-destructive">{errors.contact.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Posting..." : "Post Listing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search listings, services, products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
                activeCategory === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              )}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col overflow-hidden">
                <Skeleton className="h-28 w-full" />
                <CardContent className="flex-1 pt-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map(listing => (
              <Card
                key={listing.id}
                className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedListing(listing)}
              >
                <div className={cn("h-28 bg-gradient-to-br flex items-center justify-center relative", CATEGORY_GRADIENT[listing.category] || CATEGORY_GRADIENT.tools)}>
                  {CATEGORY_ICON_SM[listing.category] || CATEGORY_ICON_SM.tools}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 text-gray-800 text-xs font-semibold rounded-full px-3 py-1 flex items-center gap-1">
                      View details <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
                <CardContent className="flex-1 pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">{listing.title}</h3>
                    <Badge variant="secondary" className="shrink-0 text-xs">{CATEGORIES.find(c => c.value === listing.category)?.label || listing.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{listing.description}</p>
                  <div className="flex items-center gap-1 text-primary font-semibold text-sm">
                    <Tag className="h-3.5 w-3.5" />
                    {typeof listing.price === 'number' ? `RM ${listing.price}` : listing.price}
                  </div>
                  {listing.tags && listing.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {listing.tags.map(t => (
                        <span key={t} className="text-xs bg-muted rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t pt-3 pb-3">
                  <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{listing.posted}</span>
                  </div>
                  <div className="w-full flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{listing.seller}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 shrink-0"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedListing(listing);
                      }}
                    >
                      <Phone className="h-3 w-3" />
                      Contact
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <ListingDetailDialog
        listing={selectedListing}
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
}
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Search, PawPrint, Package, Smartphone, Wallet, Key, BookOpen,
  MapPin, Clock, Phone, PlusCircle, Upload, CheckCircle2, AlertCircle, ChevronRight, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type ItemCategory = "pet" | "phone" | "wallet" | "keys" | "bag" | "document" | "other";
type ItemStatus = "lost" | "found";

interface LostFoundItem {
  id: string;
  status: ItemStatus;
  category: ItemCategory;
  title: string;
  description: string;
  location: string;
  contact: string;
  date: string;
  image?: string;
  resolved: boolean;
  verified: boolean;
}

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  pet: "Pet / Animal", phone: "Phone / Tablet", wallet: "Wallet / Purse",
  keys: "Keys", bag: "Bag / Backpack", document: "Documents / IC", other: "Other",
};

const CATEGORY_ICON_LG: Record<ItemCategory, React.ReactNode> = {
  pet:      <PawPrint className="h-12 w-12" />,
  phone:    <Smartphone className="h-12 w-12" />,
  wallet:   <Wallet className="h-12 w-12" />,
  keys:     <Key className="h-12 w-12" />,
  bag:      <Package className="h-12 w-12" />,
  document: <BookOpen className="h-12 w-12" />,
  other:    <Package className="h-12 w-12" />,
};

const CATEGORY_ICON: Record<ItemCategory, React.ReactNode> = {
  pet:      <PawPrint className="h-8 w-8" />,
  phone:    <Smartphone className="h-8 w-8" />,
  wallet:   <Wallet className="h-8 w-8" />,
  keys:     <Key className="h-8 w-8" />,
  bag:      <Package className="h-8 w-8" />,
  document: <BookOpen className="h-8 w-8" />,
  other:    <Package className="h-8 w-8" />,
};

const CATEGORY_COLOR: Record<ItemCategory, string> = {
  pet:      "bg-amber-100 text-amber-700",
  phone:    "bg-blue-100 text-blue-700",
  wallet:   "bg-green-100 text-green-700",
  keys:     "bg-yellow-100 text-yellow-700",
  bag:      "bg-purple-100 text-purple-700",
  document: "bg-red-100 text-red-700",
  other:    "bg-gray-100 text-gray-700",
};

const reportSchema = z.object({
  status: z.enum(["lost", "found"]),
  category: z.enum(["pet", "phone", "wallet", "keys", "bag", "document", "other"]),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  location: z.string().min(3, "Location is required"),
  contact: z.string().min(8, "Contact is required"),
  isVerified: z.boolean().optional(),
});

type ReportForm = z.infer<typeof reportSchema>;

function ItemDetailDialog({
  item,
  open,
  onClose,
}: {
  item: LostFoundItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className={cn("h-32 flex flex-col items-center justify-center gap-2 relative", CATEGORY_COLOR[item.category])}>
          <div className="opacity-50">{CATEGORY_ICON_LG[item.category]}</div>
        </div>

        <div className="px-6 pt-4 pb-2 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("font-semibold",
                item.status === "lost"
                  ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
              )}>
                {item.status === "lost" ? <AlertCircle className="h-3.5 w-3.5 mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                {item.status.toUpperCase()}
              </Badge>
              <Badge variant="secondary">{CATEGORY_LABEL[item.category]}</Badge>
              {item.verified && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Verified Report
                </Badge>
              )}
              {item.resolved && (
                <Badge variant="outline" className="text-gray-500">Resolved</Badge>
              )}
            </div>
            <h2 className="text-xl font-bold leading-snug">{item.title}</h2>
          </div>

          {item.image && (
            <div className="rounded-lg overflow-hidden border">
              <img src={item.image} alt={item.title} className="w-full h-44 object-cover" />
            </div>
          )}

          <Separator />

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
            <p className="text-sm leading-relaxed">{item.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{item.location}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reported</p>
              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" />{item.date}</p>
            </div>
            <div className="col-span-2 space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
              <p className="flex items-center gap-1.5 font-semibold text-primary"><Phone className="h-3.5 w-3.5" />{item.contact}</p>
            </div>
          </div>

          {!item.resolved && (
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Claim Verification: </strong>
              When contacting the reporter, be prepared to describe the item with specific identifying details that only the true owner would know. This protects both parties.
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          {!item.resolved && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex-1" onClick={e => e.stopPropagation()}>
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Reporter
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Claim Verification</AlertDialogTitle>
                  <AlertDialogDescription>
                    To verify your claim, contact the reporter directly and describe specific identifying details about the item that only the real owner would know.
                    <br /><br />
                    <strong>Reporter's contact: {item.contact}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    toast({ title: "Contact noted", description: `Reach out to: ${item.contact}` });
                    onClose();
                  }}>
                    Got It
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ItemCard({ item, onView }: { item: LostFoundItem; onView: () => void }) {
  const { toast } = useToast();
  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden transition-shadow hover:shadow-md cursor-pointer group",
        item.resolved && "opacity-60"
      )}
      onClick={onView}
    >
      <div className={cn("h-24 flex items-center justify-center relative", CATEGORY_COLOR[item.category])}>
        <div className="opacity-40 group-hover:opacity-60 transition-opacity">
          {CATEGORY_ICON[item.category]}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white/90 text-gray-800 text-xs font-semibold rounded-full px-3 py-1 flex items-center gap-1 shadow-sm">
            View details <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
      <CardContent className="flex-1 pt-4 space-y-2">
        <div className="flex items-start gap-2 flex-wrap">
          <Badge className={cn("text-xs shrink-0 font-semibold",
            item.status === "lost"
              ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
              : "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
          )}>
            {item.status === "lost" ? <AlertCircle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
            {item.status.toUpperCase()}
          </Badge>
          {item.verified && (
            <Badge variant="outline" className="text-xs shrink-0 text-blue-600 border-blue-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />Verified
            </Badge>
          )}
          {item.resolved && (
            <Badge variant="outline" className="text-xs shrink-0 text-gray-500">Resolved</Badge>
          )}
        </div>
        <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t pt-3 pb-3">
        <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.date}</span>
        </div>
        {!item.resolved && (
          <div className="w-full flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs gap-1"
              onClick={e => { e.stopPropagation(); onView(); }}
            >
              <CheckCircle2 className="h-3 w-3" />
              I Know This
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 text-xs gap-1"
              onClick={e => {
                e.stopPropagation();
                toast({ title: "Contact", description: item.contact });
              }}
            >
              <Phone className="h-3 w-3" />
              Contact
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [search, setSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: { status: "lost", isVerified: false },
  });

  const fetchLostFoundItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/lostFound');
      const formattedItems: LostFoundItem[] = (result.data || []).map((item: any) => ({
        id: item._id,
        status: item.status,
        category: item.category,
        title: item.title,
        description: item.description,
        location: item.location,
        contact: item.contact,
        date: item.date || "Just now",
        image: item.image,
        resolved: item.resolved || false,
        verified: item.verified || false,
      }));
      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching lost/found items:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch lost/found items.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLostFoundItems();
  }, [fetchLostFoundItems]);

  const lostItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(i => i.status === "lost" && (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)));
  }, [items, search]);

  const foundItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(i => i.status === "found" && (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)));
  }, [items, search]);

  const onSubmit = async (data: ReportForm) => {
    try {
      await api.post('/lostFound', data);
      toast({ title: "Report submitted!", description: `Your ${data.status} item report is now live.` });
      reset();
      setImagePreview(null);
      setReportOpen(false);
      fetchLostFoundItems();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to submit report.', description: error.message });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Lost & Found
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Help reunite lost items and pets with their owners.</p>
          </div>
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Report Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Report a Lost or Found Item</DialogTitle>
                <DialogDescription>Fill in as many details as possible to help with identification.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["lost", "found"] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setValue("status", s)}
                        className={cn(
                          "rounded-lg border-2 p-3 text-sm font-medium transition-colors",
                          watch("status") === s
                            ? s === "lost" ? "border-red-500 bg-red-50 text-red-700" : "border-green-500 bg-green-50 text-green-700"
                            : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {s === "lost" ? <AlertCircle className="h-4 w-4 mx-auto mb-1" /> : <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />}
                        {s === "lost" ? "I Lost Something" : "I Found Something"}
                      </button>
                    ))}
                  </div>
                  {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={v => setValue("category", v as ItemCategory)}>
                    <SelectTrigger><SelectValue placeholder="What type of item?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pet">Pet / Animal</SelectItem>
                      <SelectItem value="phone">Phone / Tablet</SelectItem>
                      <SelectItem value="wallet">Wallet / Purse</SelectItem>
                      <SelectItem value="keys">Keys</SelectItem>
                      <SelectItem value="bag">Bag / Backpack</SelectItem>
                      <SelectItem value="document">Documents / IC</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Title / Item Name</Label>
                  <Input placeholder="e.g. Lost Golden Retriever 'Biscuit'" {...register("title")} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the item in detail — colour, size, distinguishing features, circumstances..."
                    rows={4}
                    {...register("description")}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Photo (Optional)</Label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className={"absolute top-2 right-2 bg-black/60 text-white rounded-full px-2 py-0.5 text-xs"}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted transition-colors"
                    >
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload a photo</p>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Last Known Location</Label>
                    <Input placeholder="e.g. SS2 Park, PJ" {...register("location")} />
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input placeholder="e.g. 012-3456-7890" {...register("contact")} />
                    {errors.contact && <p className="text-xs text-destructive">{errors.contact.message}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
                  <Checkbox id="verify" onCheckedChange={v => setValue("isVerified", !!v)} className="mt-0.5" />
                  <label htmlFor="verify" className="text-xs text-muted-foreground cursor-pointer">
                    I confirm that this report is truthful. For found items, I agree to only return the item to someone who can verify ownership with specific identifying details.
                  </label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search lost or found items, pets, descriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="lost">
          <TabsList className="mb-6">
            <TabsTrigger value="lost" className="gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Lost Items
              <Badge variant="secondary" className="ml-1 text-xs">{lostItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="found" className="gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Found Items
              <Badge variant="secondary" className="ml-1 text-xs">{foundItems.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lost">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="flex flex-col overflow-hidden">
                    <Skeleton className="h-32 w-full" />
                    <CardContent className="flex-1 pt-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : lostItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No lost items found</p>
                <p className="text-sm">Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {lostItems.map(item => (
                  <ItemCard key={item.id} item={item} onView={() => setSelectedItem(item)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="found">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="flex flex-col overflow-hidden">
                    <Skeleton className="h-32 w-full" />
                    <CardContent className="flex-1 pt-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : foundItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckCircle2 className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No found items reported</p>
                <p className="text-sm">Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {foundItems.map(item => (
                  <ItemCard key={item.id} item={item} onView={() => setSelectedItem(item)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ItemDetailDialog
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppHeader } from "@/components/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, PlusCircle, Trash2, ArrowUpDown, ChevronDown, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { DateValue, parseDate, getLocalTimeZone, today } from "@internationalized/date";

// Schemas for form validation
const roadDisruptionSchema = z.object({
  title: z.string().min(5, "Title is required."),
  description: z.string().min(2, "Description is required."),
  status: z.enum(["active",'inactive']),
});

const shopNotificationSchema = z.object({
  name: z.string().min(3, "Shop name is required."),
  description: z.string().min(2, "Description is required."),
  status: z.enum(["open", "closed", "maintenance"]),
  openingHours: z.object({
    opening: z.string().regex(/^\d{4}$/, "Opening time must be in HHmm format."),
    closing: z.string().regex(/^\d{4}$/, "Closing time must be in HHmm format."),
  }),
});

const parkStatusSchema = z.object({
  name: z.string().min(3, "Park name is required."),
  description: z.string().min(2, "Description is required."),
  status: z.enum(["open", "closed", "maintenance"]),
   openingHours: z.object({
    opening: z.string().regex(/^\d{4}$/, "Opening time must be in HHmm format."),
    closing: z.string().regex(/^\d{4}$/, "Closing time must be in HHmm format."),
  }),
});

const localEventSchema = z.object({
  title: z.string().min(5, "Event title is required."),
  description: z.string().min(2, "Description is required."),
  location: z.string().min(3, "Location is required."),
  eventDate: z.any().refine(val => val, { message: "Event date is required."}),
  status: z.enum(['pending', 'approved', 'rejected']),
});

const reportSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

const incidentSchema = z.object({
  title: z.string().min(5, "Title is required."),
  description: z.string().min(2, "Description is required."),
  type: z.enum(['pothole', 'flood', 'streetlight', 'crime', 'traffic']),
  severity: z.enum(['low', 'medium', 'high']),
  lat: z.number(),
  lng: z.number(),
  status: z.enum(['pending', 'approved', 'rejected']),
});

const listingSchema = z.object({
  title: z.string().min(5, "Title is required."),
  description: z.string().min(2, "Description is required."),
  category: z.enum(['electronics', 'furniture', 'clothing', 'food', 'services', 'other']),
  price: z.number().min(0, "Price must be 0 or higher."),
  seller: z.string().min(2, "Seller name is required."),
  location: z.string().min(3, "Location is required."),
  contact: z.string().min(8, "Contact is required."),
  status: z.enum(['pending', 'approved', 'rejected']),
});

const lostFoundItemSchema = z.object({
  title: z.string().min(5, "Title is required."),
  description: z.string().min(2, "Description is required."),
  category: z.enum(['pet', 'phone', 'keys', 'wallet', 'bag', 'document', 'other']),
  location: z.string().min(3, "Location is required."),
  contact: z.string().min(8, "Contact is required."),
  status: z.enum(['pending', 'approved', 'rejected']),
});

const formSchemas = {
  'Road Disruption': roadDisruptionSchema,
  'Shop Notification': shopNotificationSchema,
  'Park Status': parkStatusSchema,
  'Local Event': localEventSchema,
  'Report': reportSchema,
  'Incident': incidentSchema,
  'Listing': listingSchema,
  'LostFound': lostFoundItemSchema,
};


const ITEMS_PER_PAGE = 5;
type SortDirection = "ascending" | "descending";
interface SortConfig {
  key: string;
  direction: SortDirection;
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [action, setAction] = useState<{ type: 'add' | 'edit' | 'delete', itemType: string, data?: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<any>({
    resolver: action ? zodResolver(formSchemas[action.itemType as keyof typeof formSchemas]) : undefined,
    defaultValues: {}
  });

// Road Disruptions State
  const [roadDisruptions, setRoadDisruptions] = useState<any[]>([]);
  const [totalRoadDisruptions, setTotalRoadDisruptions] = useState(0);
  const [loadingRoadDisruptions, setLoadingRoadDisruptions] = useState(true);
  const [searchRoadDisruptions, setSearchRoadDisruptions] = useState("");
  const [currentPageRoadDisruptions, setCurrentPageRoadDisruptions] = useState(1);
  const [sortConfigRoadDisruptions, setSortConfigRoadDisruptions] = useState<SortConfig>({ key: 'date', direction: 'descending' });
  const [filtersRoadDisruptions, setFiltersRoadDisruptions] = useState<string[]>([]);

  // Shop Notifications State
  const [shopNotifications, setShopNotifications] = useState<any[]>([]);
  const [totalShopNotifications, setTotalShopNotifications] = useState(0);
  const [loadingShopNotifications, setLoadingShopNotifications] = useState(true);
  const [searchShopNotifications, setSearchShopNotifications] = useState("");
  const [currentPageShopNotifications, setCurrentPageShopNotifications] = useState(1);
  const [sortConfigShopNotifications, setSortConfigShopNotifications] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [filtersShopNotifications, setFiltersShopNotifications] = useState<string[]>([]);

  // Park Status State
  const [parkStatus, setParkStatus] = useState<any[]>([]);
  const [totalParkStatus, setTotalParkStatus] = useState(0);
  const [loadingParkStatus, setLoadingParkStatus] = useState(true);
  const [searchParkStatus, setSearchParkStatus] = useState("");
  const [currentPageParkStatus, setCurrentPageParkStatus] = useState(1);
  const [sortConfigParkStatus, setSortConfigParkStatus] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [filtersParkStatus, setFiltersParkStatus] = useState<string[]>([]);

  // Local Events State
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [totalLocalEvents, setTotalLocalEvents] = useState(0);
  const [loadingLocalEvents, setLoadingLocalEvents] = useState(true);
  const [searchLocalEvents, setSearchLocalEvents] = useState("");
  const [currentPageLocalEvents, setCurrentPageLocalEvents] = useState(1);
  const [sortConfigLocalEvents, setSortConfigLocalEvents] = useState<SortConfig>({ key: 'title', direction: 'ascending' });
  const [filtersLocalEvents, setFiltersLocalEvents] = useState<string[]>([]);

  // Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [loadingReports, setLoadingReports] = useState(true);
  const [searchReports, setSearchReports] = useState("");
  const [currentPageReports, setCurrentPageReports] = useState(1);
  const [sortConfigReports, setSortConfigReports] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [filtersReports, setFiltersReports] = useState<string[]>([]);

  // Incidents State
  const [incidents, setIncidents] = useState<any[]>([]);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [searchIncidents, setSearchIncidents] = useState("");
  const [currentPageIncidents, setCurrentPageIncidents] = useState(1);
  const [sortConfigIncidents, setSortConfigIncidents] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [filtersIncidents, setFiltersIncidents] = useState<string[]>([]);

  // Marketplace State
  const [listings, setListings] = useState<any[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [loadingListings, setLoadingListings] = useState(true);
  const [searchListings, setSearchListings] = useState("");
  const [currentPageListings, setCurrentPageListings] = useState(1);
  const [sortConfigListings, setSortConfigListings] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [filtersListings, setFiltersListings] = useState<string[]>([]);

  // Lost & Found State
  const [lostFoundItems, setLostFoundItems] = useState<any[]>([]);
  const [totalLostFoundItems, setTotalLostFoundItems] = useState(0);
  const [loadingLostFoundItems, setLoadingLostFoundItems] = useState(true);
  const [searchLostFoundItems, setSearchLostFoundItems] = useState("");
  const [currentPageLostFoundItems, setCurrentPageLostFoundItems] = useState(1);
  const [sortConfigLostFoundItems, setSortConfigLostFoundItems] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [filtersLostFoundItems, setFiltersLostFoundItems] = useState<string[]>([]);

  useEffect(() => {
    if (action?.type === 'edit' && action.data) {
      const itemType = action.itemType;
      let defaultValues = { ...action.data };
       if (itemType === 'Local Event' && action.data.eventDate) {
        try {
          defaultValues.eventDate = parseDate(action.data.eventDate.split('T')[0]);
        } catch(e) {
          console.error("Error parsing date for edit:", e);
          defaultValues.eventDate = null;
        }
      }
      form.reset(defaultValues);
    } else if (action?.type === 'add') {
      form.reset({});
    }
  }, [action, form]);

  const fetchRoadDisruptions = useCallback(async () => {
    setLoadingRoadDisruptions(true);
    try {
      const params = {
        pageNumber: currentPageRoadDisruptions,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchRoadDisruptions,
        sort: sortConfigRoadDisruptions.key,
        order: sortConfigRoadDisruptions.direction === 'ascending' ? 'asc' : 'desc',
      };
      const result = await api.get('/disruptions', { params });
      let processedData = result.data.map((item: any) => ({ ...item, date: new Date(item.createdAt) }));
      setRoadDisruptions(processedData);
      setTotalRoadDisruptions(result.total);
    } catch (error) {
      console.error('Error fetching road disruptions:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch road disruptions.' });
    } finally {
      setLoadingRoadDisruptions(false);
    }
  }, [currentPageRoadDisruptions, searchRoadDisruptions, sortConfigRoadDisruptions, toast]);

  const fetchShopNotifications = useCallback(async () => {
    setLoadingShopNotifications(true);
    try {
      const params = {
        pageNumber: currentPageShopNotifications,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchShopNotifications,
        sort: sortConfigShopNotifications.key,
        order: sortConfigShopNotifications.direction === 'ascending' ? 'asc' : 'desc',
        filters: filtersShopNotifications.join(','),
      };
      const result = await api.get('/shops', { params });
      // Process data to ensure openingHours exists and prevent undefined errors
      const processedData = result.data.map((item: any) => ({
        ...item,
        openingHours: {
          opening: item.openingHours?.opening ?? '0000',
          closing: item.openingHours?.closing ?? '2359'
        }
      }));
      setShopNotifications(processedData);
      setTotalShopNotifications(result.total);
    } catch (error) {
      console.error('Error fetching shop notifications:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch shop notifications.' });
    } finally {
      setLoadingShopNotifications(false);
    }
  }, [currentPageShopNotifications, searchShopNotifications, sortConfigShopNotifications, filtersShopNotifications, toast]);

  const fetchParkStatus = useCallback(async () => {
    setLoadingParkStatus(true);
    try {
      const params = {
        pageNumber: currentPageParkStatus,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchParkStatus,
        sort: sortConfigParkStatus.key,
        order: sortConfigParkStatus.direction === 'ascending' ? 'asc' : 'desc',
        filters: filtersParkStatus.join(','),
      };
      const result = await api.get('/parks', { params });
      // Process data to ensure openingHours exists and prevent undefined errors
      const processedData = result.data.map((item: any) => ({
        ...item,
        openingHours: {
          opening: item.openingHours?.opening ?? '0000',
          closing: item.openingHours?.closing ?? '2359'
        }
      }));
      setParkStatus(processedData);
      setTotalParkStatus(result.total);
    } catch (error) {
      console.error('Error fetching park status:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch park status.' });
    } finally {
      setLoadingParkStatus(false);
    }
  }, [currentPageParkStatus, searchParkStatus, sortConfigParkStatus, filtersParkStatus, toast]);

  const fetchLocalEvents = useCallback(async () => {
    setLoadingLocalEvents(true);
    try {
      const params = {
        pageNumber: currentPageLocalEvents,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchLocalEvents,
        sort: sortConfigLocalEvents.key,
        order: sortConfigLocalEvents.direction === 'ascending' ? 'asc' : 'desc',
        filters: filtersLocalEvents.join(','),
      };
      const result = await api.get('/events', { params });
      let processedData = result.data.map((item: any) => ({ ...item, date: new Date(item.eventDate) }));
      setLocalEvents(processedData);
      setTotalLocalEvents(result.total);
    } catch (error) {
      console.error('Error fetching local events:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch local events.' });
    } finally {
      setLoadingLocalEvents(false);
    }
  }, [currentPageLocalEvents, searchLocalEvents, sortConfigLocalEvents, filtersLocalEvents, toast]);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const params = {
        pageNumber: currentPageReports,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchReports,
        sort: sortConfigReports.key,
        order: sortConfigReports.direction === 'ascending' ? 'asc' : 'desc',
        filters: filtersReports.join(','),
      };
      const result = await api.get('/reports', { params });
      let processedData = result.data.map((item: any) => ({ ...item, createdAt: new Date(item.reportedAt) }));
      setReports(processedData);
      setTotalReports(result.total);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch reports.' });
    } finally {
      setLoadingReports(false);
    }
  }, [currentPageReports, searchReports, sortConfigReports, filtersReports, toast]);

  const fetchIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    try {
      const params = {
        pageNumber: currentPageIncidents,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchIncidents,
        sort: sortConfigIncidents.key,
        order: sortConfigIncidents.direction === 'ascending' ? 'asc' : 'desc',
        filters: filtersIncidents.join(','),
      };
      const result = await api.get('/incidents', { params });
      setIncidents(result.data);
      setTotalIncidents(result.total);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch incidents.' });
    } finally {
      setLoadingIncidents(false);
    }
  }, [currentPageIncidents, searchIncidents, sortConfigIncidents, filtersIncidents, toast]);

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = {
        pageNumber: currentPageListings,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchListings,
        sort: sortConfigListings.key,
        order: sortConfigListings.direction === 'ascending' ? 'asc' : 'desc',
        filters: filtersListings.join(','),
      };
      const result = await api.get('/listings', { params });
      setListings(result.data);
      setTotalListings(result.total);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch listings.' });
    } finally {
      setLoadingListings(false);
    }
  }, [currentPageListings, searchListings, sortConfigListings, filtersListings, toast]);

  const fetchLostFoundItems = useCallback(async () => {
    setLoadingLostFoundItems(true);
    try {
      const params = {
        pageNumber: currentPageLostFoundItems,
        dataPerPage: ITEMS_PER_PAGE,
        search: searchLostFoundItems,
        sort: sortConfigLostFoundItems.key,
        order: sortConfigLostFoundItems.direction === 'ascending' ? 'asc' : 'desc',
        filters: filtersLostFoundItems.join(','),
      };
      const result = await api.get('/lostFound', { params });
      setLostFoundItems(result.data);
      setTotalLostFoundItems(result.total);
    } catch (error) {
      console.error('Error fetching lost & found items:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch lost & found items.' });
    } finally {
      setLoadingLostFoundItems(false);
    }
  }, [currentPageLostFoundItems, searchLostFoundItems, sortConfigLostFoundItems, filtersLostFoundItems, toast]);

  useEffect(() => { fetchRoadDisruptions(); }, [fetchRoadDisruptions]);
  useEffect(() => { fetchShopNotifications(); }, [fetchShopNotifications]);
  useEffect(() => { fetchParkStatus(); }, [fetchParkStatus]);
  useEffect(() => { fetchLocalEvents(); }, [fetchLocalEvents]);
  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);
  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { fetchLostFoundItems(); }, [fetchLostFoundItems]);
  
  const closeDialogs = () => {
    setAction(null);
    form.reset({});
  };

  const handleFormSubmit = async (values: any) => {
    if (!action) return;

    setIsSubmitting(true);
    const { type, itemType, data } = action;
    const isEdit = type === 'edit';
    const adminUser = localStorage.getItem('adminUser');

    let payload = { ...values, adminId: adminUser };
    if (itemType === 'Local Event' && payload.eventDate && typeof payload.eventDate.toDate === 'function') {
      payload.eventDate = payload.eventDate.toDate(getLocalTimeZone()).toISOString();
    }
    
    const endpointMap: { [key: string]: string } = {
        'Road Disruption': 'disruptions',
        'Shop Notification': 'shops',
        'Park Status': 'parks',
        'Local Event': 'events',
        'Report': 'reports',
        'Incident': 'incidents',
        'Listing': 'listings',
        'LostFound': 'lostFound',
    };

    const endpoint = endpointMap[itemType];

    let url = `/${endpoint}`;
    const method = isEdit ? 'patch' : 'post';

    if (isEdit && data?._id) {
      url = `${url}/${data._id}`;
    }
    try {
        await api[method](url, payload);
        toast({
            title: "Success!",
            description: `${itemType} has been successfully ${isEdit ? 'updated' : 'added'}.`,
        });

        // Refetch data
        if (itemType === 'Road Disruption') fetchRoadDisruptions();
        if (itemType === 'Shop Notification') fetchShopNotifications();
        if (itemType === 'Park Status') fetchParkStatus();
        if (itemType === 'Local Event') fetchLocalEvents();
        if (itemType === 'Report') fetchReports();
        if (itemType === 'Incident') fetchIncidents();
        if (itemType === 'Listing') fetchListings();
        if (itemType === 'LostFound') fetchLostFoundItems();

        closeDialogs();
    } catch (error: any) {
        console.error(`Error submitting form for ${itemType}:`, error);
        toast({
            variant: "destructive",
            title: "An error occurred.",
            description: error.message || `Could not ${type} the ${itemType}. Please try again.`,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!action || !action.data) return;

    setIsSubmitting(true);
    const { itemType, data } = action;

    const endpointMap: { [key: string]: string } = {
        'Road Disruption': 'disruptions',
        'Shop Notification': 'shops',
        'Park Status': 'parks',
        'Local Event': 'events',
        'Report': 'reports',
        'Incident': 'incidents',
        'Listing': 'listings',
        'LostFound': 'lostFound',
    };

    const endpoint = endpointMap[itemType];
    const url = `/${endpoint}/${data._id}`;

    try {
       await api.delete(url);

        toast({
            title: "Success!",
            description: `${itemType} has been successfully deleted.`,
        });

        // Refetch data after successful deletion
        if (itemType === 'Road Disruption') fetchRoadDisruptions();
        if (itemType === 'Shop Notification') fetchShopNotifications();
        if (itemType === 'Park Status') fetchParkStatus();
        if (itemType === 'Local Event') fetchLocalEvents();
        if (itemType === 'Report') fetchReports();

        closeDialogs();
    } catch (error: any) {
        console.error(`Error deleting ${itemType}:`, error);
        toast({
            variant: "destructive",
            title: "An error occurred.",
            description: error.message || `Could not delete the ${itemType}. Please try again.`,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const sortConfigMap: { [key: string]: { config: SortConfig, setConfig: (c: SortConfig) => void } } = {
    roadDisruptions: { config: sortConfigRoadDisruptions, setConfig: setSortConfigRoadDisruptions },
    shopNotifications: { config: sortConfigShopNotifications, setConfig: setSortConfigShopNotifications },
    parkStatus: { config: sortConfigParkStatus, setConfig: setSortConfigParkStatus },
    localEvents: { config: sortConfigLocalEvents, setConfig: setSortConfigLocalEvents },
    reports: { config: sortConfigReports, setConfig: setSortConfigReports },
    incidents: { config: sortConfigIncidents, setConfig: setSortConfigIncidents },
    listings: { config: sortConfigListings, setConfig: setSortConfigListings },
    lostFoundItems: { config: sortConfigLostFoundItems, setConfig: setSortConfigLostFoundItems },
  };
  
  const handleSort = (table: string, key: string) => {
    const { config, setConfig } = sortConfigMap[table];
    let direction: SortDirection = 'ascending';
    if (config.key === key && config.direction === 'ascending') {
      direction = 'descending';
    }
    setConfig({ key, direction });
  };
  
  const handleFilterChange = (
    table: 'roadDisruptions' | 'shopNotifications' | 'parkStatus' | 'localEvents' | 'reports' | 'incidents' | 'listings' | 'lostFoundItems',
    value: string
  ) => {
    const filterStateMap: Record<string, { filters: string[], setFilters: (f: string[]) => void, setCurrentPage: (p: number) => void }> = {
        roadDisruptions: { filters: filtersRoadDisruptions, setFilters: setFiltersRoadDisruptions, setCurrentPage: setCurrentPageRoadDisruptions },
        shopNotifications: { filters: filtersShopNotifications, setFilters: setFiltersShopNotifications, setCurrentPage: setCurrentPageShopNotifications },
        parkStatus: { filters: filtersParkStatus, setFilters: setFiltersParkStatus, setCurrentPage: setCurrentPageParkStatus },
        localEvents: { filters: filtersLocalEvents, setFilters: setFiltersLocalEvents, setCurrentPage: setCurrentPageLocalEvents },
        reports: { filters: filtersReports, setFilters: setFiltersReports, setCurrentPage: setCurrentPageReports },
        incidents: { filters: filtersIncidents, setFilters: setFiltersIncidents, setCurrentPage: setCurrentPageIncidents },
        listings: { filters: filtersListings, setFilters: setFiltersListings, setCurrentPage: setCurrentPageListings },
        lostFoundItems: { filters: filtersLostFoundItems, setFilters: setFiltersLostFoundItems, setCurrentPage: setCurrentPageLostFoundItems },
    };

    const state = filterStateMap[table];
    if (!state) return;
    const { filters, setFilters, setCurrentPage } = state;
    const newFilters = filters.includes(value)
        ? filters.filter((item) => item !== value)
        : [...filters, value];
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleAction = (type: 'add' | 'edit' | 'delete', itemType: string, data?: any) => {
    setAction({ type, itemType, data });
  };
  
  const SortArrow = ({ columnKey, table }: { columnKey: string, table: string }) => {
    const { config } = sortConfigMap[table];
    if (config.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return config.direction === 'ascending' ? '▲' : '▼';
  };

  const renderSkeleton = (columns: number) =>
    Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
                <Skeleton className="h-8 w-full" />
            </TableCell>
        ))}
      </TableRow>
  ));

  const totalRoadDisruptionPages = Math.ceil(totalRoadDisruptions / ITEMS_PER_PAGE);
  const totalShopNotificationPages = Math.ceil(totalShopNotifications / ITEMS_PER_PAGE);
  const totalParkStatusPages = Math.ceil(totalParkStatus / ITEMS_PER_PAGE);
  const totalLocalEventPages = Math.ceil(totalLocalEvents / ITEMS_PER_PAGE);
  const totalReportPages = Math.ceil(totalReports / ITEMS_PER_PAGE);
  const totalIncidentPages = Math.ceil(totalIncidents / ITEMS_PER_PAGE);
  const totalListingPages = Math.ceil(totalListings / ITEMS_PER_PAGE);
  const totalLostFoundPages = Math.ceil(totalLostFoundItems / ITEMS_PER_PAGE);

  const renderForm = () => {
    if (!action || (action.type !== 'add' && action.type !== 'edit')) return null;

    const { itemType, data } = action;
    const isReadOnly = (itemType === 'Local Event' && data?.status === 'rejected') || (itemType === 'Report' && data?.status === 'rejected');

    switch (itemType) {
      case 'Road Disruption':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title" data-speakable="true">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" data-speakable="true">Description</Label>
              <Textarea id="description" {...form.register("description")} />
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label data-speakable="true">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.status && <p className="text-sm text-destructive">{form.formState.errors.status.message as string}</p>}
            </div>
          </>
        );
      case 'Shop Notification':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name" data-speakable="true">Shop Name</Label>
              <Input id="name" {...form.register("name")} />
               {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" data-speakable="true">Description</Label>
              <Textarea id="description" {...form.register("description")} />
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label data-speakable="true">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
               {form.formState.errors.status && <p className="text-sm text-destructive">{form.formState.errors.status.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="opening" data-speakable="true">Opening Time (HHmm)</Label>
                    <Input id="opening" {...form.register("openingHours.opening")} />
                     {(form.formState.errors as any).openingHours?.opening && <p className="text-sm text-destructive">{(form.formState.errors as any).openingHours.opening.message as string}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="closing" data-speakable="true">Closing Time (HHmm)</Label>
                    <Input id="closing" {...form.register("openingHours.closing")} />
                    {(form.formState.errors as any).openingHours?.closing && <p className="text-sm text-destructive">{(form.formState.errors as any).openingHours.closing.message as string}</p>}
                </div>
            </div>
          </>
        );
      case 'Park Status':
          return (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" data-speakable="true">Park Name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" data-speakable="true">Description</Label>
                <Textarea id="description" {...form.register("description")} />
                  {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label data-speakable="true">Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.status && <p className="text-sm text-destructive">{form.formState.errors.status.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="opening" data-speakable="true">Opening Time (HHmm)</Label>
                      <Input id="opening" {...form.register("openingHours.opening")} />
                      {(form.formState.errors as any).openingHours?.opening && <p className="text-sm text-destructive">{(form.formState.errors as any).openingHours.opening.message as string}</p>}
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="closing" data-speakable="true">Closing Time (HHmm)</Label>
                      <Input id="closing" {...form.register("openingHours.closing")} />
                        {(form.formState.errors as any).openingHours?.closing && <p className="text-sm text-destructive">{(form.formState.errors as any).openingHours.closing.message as string}</p>}
                  </div>
              </div>
            </>
          );
      case 'Local Event':
          return (
            <>
              <div className="space-y-2">
                <Label htmlFor="title" data-speakable="true">Event Title</Label>
                <Input id="title" {...form.register("title")} readOnly={isReadOnly}/>
                  {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" data-speakable="true">Description</Label>
                <Textarea id="description" {...form.register("description")} readOnly={isReadOnly}/>
                {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message as string}</p>}
              </div>
                <div className="space-y-2">
                <Label htmlFor="location" data-speakable="true">Location</Label>
                <Input id="location" {...form.register("location")} readOnly={isReadOnly}/>
                  {form.formState.errors.location && <p className="text-sm text-destructive">{form.formState.errors.location.message as string}</p>}
              </div>
              <div className="space-y-2">
                  <Label data-speakable="true">Event Date</Label>
                    <Controller
                      control={form.control}
                      name="eventDate"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild disabled={isReadOnly}>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? field.value.toString() : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              aria-label="Event date"
                              value={field.value as DateValue | undefined}
                              onChange={field.onChange}
                              minValue={today(getLocalTimeZone())}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {form.formState.errors.eventDate && <p className="text-sm text-destructive">{form.formState.errors.eventDate.message as string}</p>}
              </div>
               <div className="space-y-2">
                  <Label data-speakable="true">Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                        <SelectTrigger className="capitalize">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
            </>
          );
      case 'Report':
        return (
          <>
            <div className="space-y-2">
              <Label data-speakable="true">Category</Label>
              <Input readOnly defaultValue={data.category} disabled={true}/>
            </div>
            <div className="space-y-2">
              <Label data-speakable="true">Location</Label>
              <Input readOnly defaultValue={data.location} disabled={true}/>
            </div>
            <div className="space-y-2">
              <Label data-speakable="true">Description</Label>
              <Textarea readOnly defaultValue={data.description} disabled={true}/>
            </div>
            <div className="space-y-2">
              <Label data-speakable="true">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.status && <p className="text-sm text-destructive">{form.formState.errors.status.message as string}</p>}
            </div>
          </>
        );
      default:
        return <p>No form available for this item type.</p>;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Road Disruptions</CardTitle>
                <CardDescription data-speakable="true">
                  Manage all road disruption reports.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <Input
                  placeholder="Search disruptions..."
                  value={searchRoadDisruptions}
                  onChange={(e) => {setSearchRoadDisruptions(e.target.value); setCurrentPageRoadDisruptions(1);}}
                  className="w-full sm:w-auto"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['active', 'inactive', 'pending'].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={filtersRoadDisruptions.includes(status)}
                        onCheckedChange={() => handleFilterChange('roadDisruptions', status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="gap-1" onClick={() => handleAction('add', 'Road Disruption')}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add New
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('roadDisruptions', 'title')} data-speakable="true">
                        Title
                        <SortArrow table="roadDisruptions" columnKey="title" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('roadDisruptions', 'date')} data-speakable="true">
                        Reported
                        <SortArrow table="roadDisruptions" columnKey="date" />
                      </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('roadDisruptions', 'status')} data-speakable="true">
                         Status
                         <SortArrow table="roadDisruptions" columnKey="status" />
                       </Button>
                    </TableHead>
                    <TableHead className="text-right" data-speakable="true">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRoadDisruptions ? renderSkeleton(4) :
                  roadDisruptions.length > 0 ? roadDisruptions.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium" data-speakable="true">{item.title}</TableCell>
                      <TableCell data-speakable="true">{formatDistanceToNow(item.date, { addSuffix: true })}</TableCell>
                      <TableCell>
                        <Badge data-speakable="true" variant={item.status === 'active' ? 'default' : 'destructive' } className={item.status === 'active' ? 'bg-green-600' :''}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'Road Disruption', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'Road Disruption', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No results found.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
             <CardFooter className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Page {currentPageRoadDisruptions} of {totalRoadDisruptionPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageRoadDisruptions(p => p - 1)}
                  disabled={currentPageRoadDisruptions <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageRoadDisruptions(p => p + 1)}
                  disabled={currentPageRoadDisruptions >= totalRoadDisruptionPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Shop Notifications</CardTitle>
                <CardDescription data-speakable="true">
                  Manage local business notifications.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search notifications..."
                  value={searchShopNotifications}
                  onChange={(e) => {setSearchShopNotifications(e.target.value); setCurrentPageShopNotifications(1);}}
                  className="w-full sm:w-auto"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['open', 'closed', 'maintenance'].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={filtersShopNotifications.includes(status)}
                        onCheckedChange={() => handleFilterChange('shopNotifications', status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="gap-1" onClick={() => handleAction('add', 'Shop Notification')}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add New
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('shopNotifications', 'name')} data-speakable="true">
                         Name
                         <SortArrow table="shopNotifications" columnKey="name" />
                       </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('shopNotifications', 'description')} data-speakable="true">
                         Description
                         <SortArrow table="shopNotifications" columnKey="description" />
                       </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('shopNotifications', 'status')} data-speakable="true">
                         Status
                         <SortArrow table="shopNotifications" columnKey="status" />
                       </Button>
                    </TableHead>
                    <TableHead className="text-right" data-speakable="true">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {loadingShopNotifications ? renderSkeleton(4) : 
                   shopNotifications.length > 0 ? shopNotifications.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium" data-speakable="true">{item.name}</TableCell>
                      <TableCell data-speakable="true">{item.description}</TableCell>
                      <TableCell>
                        <Badge data-speakable="true" variant={item.status === 'open' ? 'default' : item.status === 'maintenance' ? 'secondary' : 'destructive'} className={item.status === 'open' ? 'bg-green-600' : item.status === 'maintenance' ? 'bg-yellow-500' : ''}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'Shop Notification', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'Shop Notification', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No results found.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">
                Page {currentPageShopNotifications} of {totalShopNotificationPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageShopNotifications(p => p - 1)}
                  disabled={currentPageShopNotifications <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageShopNotifications(p => p + 1)}
                  disabled={currentPageShopNotifications >= totalShopNotificationPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Park Status</CardTitle>
                <CardDescription data-speakable="true">Manage local park statuses.</CardDescription>
              </div>
               <div className="flex items-center gap-2">
                <Input
                  placeholder="Search parks..."
                  value={searchParkStatus}
                  onChange={(e) => {setSearchParkStatus(e.target.value); setCurrentPageParkStatus(1);}}
                  className="w-full sm:w-auto"
                />
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['open', 'closed', 'maintenance'].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={filtersParkStatus.includes(status)}
                        onCheckedChange={() => handleFilterChange('parkStatus', status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="gap-1" onClick={() => handleAction('add', 'Park Status')}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add New
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('parkStatus', 'name')} data-speakable="true">
                         Park
                         <SortArrow table="parkStatus" columnKey="name" />
                       </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('parkStatus', 'description')} data-speakable="true">
                         Message
                         <SortArrow table="parkStatus" columnKey="description" />
                       </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('parkStatus', 'status')} data-speakable="true">
                         Status
                         <SortArrow table="parkStatus" columnKey="status" />
                       </Button>
                    </TableHead>
                    <TableHead className="text-right" data-speakable="true">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingParkStatus ? renderSkeleton(4) : 
                  parkStatus.length > 0 ? parkStatus.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium" data-speakable="true">{item.name}</TableCell>
                      <TableCell data-speakable="true">{item.description}</TableCell>
                      <TableCell>
                        <Badge data-speakable="true" variant={item.status === 'open' ? 'default' : item.status === 'maintenance' ? 'secondary' : 'destructive'} className={item.status === 'open' ? 'bg-green-600' : item.status === 'maintenance' ? 'bg-yellow-500' : ''}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'Park Status', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'Park Status', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No results found.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
             <CardFooter className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">
                Page {currentPageParkStatus} of {totalParkStatusPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageParkStatus(p => p - 1)}
                  disabled={currentPageParkStatus <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageParkStatus(p => p + 1)}
                  disabled={currentPageParkStatus >= totalParkStatusPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Local Events</CardTitle>
                <CardDescription data-speakable="true">Manage community events and review proposals.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                    placeholder="Search events..."
                    value={searchLocalEvents}
                    onChange={(e) => {setSearchLocalEvents(e.target.value); setCurrentPageLocalEvents(1);}}
                    className="w-full sm:w-auto"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="ml-auto">
                        Status <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {['approved', 'pending', 'rejected'].map((status) => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          className="capitalize"
                          checked={filtersLocalEvents.includes(status)}
                          onCheckedChange={() => handleFilterChange('localEvents', status)}
                        >
                          {status}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                <Button size="sm" className="gap-1" onClick={() => handleAction('add', 'Local Event')}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add New
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('localEvents', 'title')} data-speakable="true">
                         Event
                         <SortArrow table="localEvents" columnKey="title" />
                       </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('localEvents', 'date')} data-speakable="true">
                         Date
                         <SortArrow table="localEvents" columnKey="date" />
                       </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('localEvents', 'location')} data-speakable="true">
                         Location
                         <SortArrow table="localEvents" columnKey="location" />
                       </Button>
                    </TableHead>
                     <TableHead>
                       <Button variant="ghost" onClick={() => handleSort('localEvents', 'status')} data-speakable="true">
                         Status
                         <SortArrow table="localEvents" columnKey="status" />
                       </Button>
                    </TableHead>
                    <TableHead className="text-right" data-speakable="true">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLocalEvents ? renderSkeleton(5) :
                  localEvents.length > 0 ? localEvents.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium" data-speakable="true">{item.title}</TableCell>
                      <TableCell data-speakable="true">{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell data-speakable="true">{item.location}</TableCell>
                       <TableCell>
                        <Badge
                          variant={
                            item.status === 'approved' ? 'default' :
                            item.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }
                          className={cn(
                            'capitalize',
                            item.status === 'approved' && 'bg-green-600',
                            item.status === 'pending' && 'bg-yellow-500',
                          )}
                          data-speakable="true"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'Local Event', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'Local Event', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No results found.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">
                Page {currentPageLocalEvents} of {totalLocalEventPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageLocalEvents(p => p - 1)}
                  disabled={currentPageLocalEvents <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageLocalEvents(p => p + 1)}
                  disabled={currentPageLocalEvents >= totalLocalEventPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Issue Reports</CardTitle>
                <CardDescription data-speakable="true">
                  Manage all user-submitted issue reports.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search reports..."
                  value={searchReports}
                  onChange={(e) => {setSearchReports(e.target.value); setCurrentPageReports(1);}}
                  className="w-full sm:w-auto"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['pending', 'approved', 'rejected'].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={filtersReports.includes(status)}
                        onCheckedChange={() => handleFilterChange('reports', status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('reports', 'category')}>
                        Category
                        <SortArrow table="reports" columnKey="category" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('reports', 'description')}>
                        Description
                        <SortArrow table="reports" columnKey="description" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('reports', 'location')}>
                        Location
                        <SortArrow table="reports" columnKey="location" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('reports', 'createdAt')}>
                        Date
                        <SortArrow table="reports" columnKey="createdAt" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('reports', 'status')}>
                        Status
                        <SortArrow table="reports" columnKey="status" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReports ? renderSkeleton(6) :
                  reports.length > 0 ? reports.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium capitalize">
                        {(item.category || item.type || '').replace(/-/g, ' ')}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                         <Badge
                          variant={
                            item.status === 'approved' ? 'default' :
                            item.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }
                          className={cn(
                            'capitalize',
                            item.status === 'approved' && 'bg-green-600',
                            item.status === 'pending' && 'bg-yellow-500',
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'Report', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'Report', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No reports found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">
                Page {currentPageReports} of {totalReportPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageReports(p => p - 1)}
                  disabled={currentPageReports <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageReports(p => p + 1)}
                  disabled={currentPageReports >= totalReportPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Incident Map Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Incident Map</CardTitle>
                <CardDescription data-speakable="true">
                  Manage community-reported incidents on the map.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search incidents..."
                  value={searchIncidents}
                  onChange={(e) => {setSearchIncidents(e.target.value); setCurrentPageIncidents(1);}}
                  className="w-full sm:w-auto"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['pending', 'approved', 'rejected'].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={filtersIncidents.includes(status)}
                        onCheckedChange={() => handleFilterChange('incidents', status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="gap-1" onClick={() => handleAction('add', 'Incident')}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add New
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('incidents', 'title')} data-speakable="true">
                        Title
                        <SortArrow table="incidents" columnKey="title" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('incidents', 'type')} data-speakable="true">
                        Type
                        <SortArrow table="incidents" columnKey="type" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('incidents', 'severity')} data-speakable="true">
                        Severity
                        <SortArrow table="incidents" columnKey="severity" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('incidents', 'status')} data-speakable="true">
                        Status
                        <SortArrow table="incidents" columnKey="status" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right" data-speakable="true">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingIncidents ? renderSkeleton(5) :
                  incidents.length > 0 ? incidents.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium" data-speakable="true">{item.title}</TableCell>
                      <TableCell data-speakable="true" className="capitalize">{item.type}</TableCell>
                      <TableCell data-speakable="true">
                        <Badge variant="secondary" className="capitalize">{item.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}
                          className={cn(
                            'capitalize',
                            item.status === 'approved' && 'bg-green-600',
                            item.status === 'pending' && 'bg-yellow-500',
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'Incident', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'Incident', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">No incidents found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Page {currentPageIncidents} of {totalIncidentPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageIncidents(p => p - 1)}
                  disabled={currentPageIncidents <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageIncidents(p => p + 1)}
                  disabled={currentPageIncidents >= totalIncidentPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Marketplace Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Marketplace</CardTitle>
                <CardDescription data-speakable="true">
                  Manage community marketplace listings.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search listings..."
                  value={searchListings}
                  onChange={(e) => {setSearchListings(e.target.value); setCurrentPageListings(1);}}
                  className="w-full sm:w-auto"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['pending', 'approved', 'rejected'].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={filtersListings.includes(status)}
                        onCheckedChange={() => handleFilterChange('listings', status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="gap-1" onClick={() => handleAction('add', 'Listing')}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add New
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('listings', 'title')} data-speakable="true">
                        Title
                        <SortArrow table="listings" columnKey="title" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('listings', 'category')} data-speakable="true">
                        Category
                        <SortArrow table="listings" columnKey="category" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('listings', 'price')} data-speakable="true">
                        Price
                        <SortArrow table="listings" columnKey="price" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('listings', 'status')} data-speakable="true">
                        Status
                        <SortArrow table="listings" columnKey="status" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right" data-speakable="true">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingListings ? renderSkeleton(5) :
                  listings.length > 0 ? listings.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium" data-speakable="true">{item.title}</TableCell>
                      <TableCell data-speakable="true" className="capitalize">{item.category}</TableCell>
                      <TableCell data-speakable="true">RM {item.price}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}
                          className={cn(
                            'capitalize',
                            item.status === 'approved' && 'bg-green-600',
                            item.status === 'pending' && 'bg-yellow-500',
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'Listing', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'Listing', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">No listings found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Page {currentPageListings} of {totalListingPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageListings(p => p - 1)}
                  disabled={currentPageListings <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageListings(p => p + 1)}
                  disabled={currentPageListings >= totalListingPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Lost & Found Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle data-speakable="true">Lost & Found</CardTitle>
                <CardDescription data-speakable="true">
                  Manage lost and found items in the community.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search lost & found..."
                  value={searchLostFoundItems}
                  onChange={(e) => {setSearchLostFoundItems(e.target.value); setCurrentPageLostFoundItems(1);}}
                  className="w-full sm:w-auto"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['pending', 'approved', 'rejected'].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={filtersLostFoundItems.includes(status)}
                        onCheckedChange={() => handleFilterChange('lostFoundItems', status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="gap-1" onClick={() => handleAction('add', 'LostFound')}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add New
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('lostFoundItems', 'title')} data-speakable="true">
                        Title
                        <SortArrow table="lostFoundItems" columnKey="title" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('lostFoundItems', 'category')} data-speakable="true">
                        Category
                        <SortArrow table="lostFoundItems" columnKey="category" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('lostFoundItems', 'location')} data-speakable="true">
                        Location
                        <SortArrow table="lostFoundItems" columnKey="location" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('lostFoundItems', 'status')} data-speakable="true">
                        Status
                        <SortArrow table="lostFoundItems" columnKey="status" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right" data-speakable="true">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLostFoundItems ? renderSkeleton(5) :
                  lostFoundItems.length > 0 ? lostFoundItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium" data-speakable="true">{item.title}</TableCell>
                      <TableCell data-speakable="true" className="capitalize">{item.category}</TableCell>
                      <TableCell data-speakable="true">{item.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}
                          className={cn(
                            'capitalize',
                            item.status === 'approved' && 'bg-green-600',
                            item.status === 'pending' && 'bg-yellow-500',
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('edit', 'LostFound', item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('delete', 'LostFound', item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">No lost & found items.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Page {currentPageLostFoundItems} of {totalLostFoundPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageLostFoundItems(p => p - 1)}
                  disabled={currentPageLostFoundItems <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageLostFoundItems(p => p + 1)}
                  disabled={currentPageLostFoundItems >= totalLostFoundPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      {/* Dialog for Add/Edit */}
      <Dialog open={action?.type === 'add' || action?.type === 'edit'} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle data-speakable="true">
              {action?.type === 'add' ? 'Add New' : 'Edit'} {action?.itemType}
            </DialogTitle>
             <DialogDescription data-speakable="true">
                Make changes here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <div className="grid gap-4 py-4">
              {renderForm()}
            </div>
             <DialogFooter>
                {(action?.itemType === 'Local Event' && action.data?.status === 'rejected') || (action?.itemType === 'Report' && action.data?.status === 'rejected') ? (
                    <Button variant="outline" onClick={closeDialogs} type="button">Close</Button>
                ) : (
                    <>
                    <Button variant="outline" onClick={closeDialogs} type="button">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    </>
                )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* AlertDialog for Delete */}
      <AlertDialog open={action?.type === 'delete'} onOpenChange={(open) => !open && closeDialogs()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-speakable="true">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription data-speakable="true">
              This action cannot be undone. This will permanently delete this {action?.itemType?.toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialogs}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    
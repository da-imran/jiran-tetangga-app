
import { useState, useEffect, useMemo } from "react";
import { isSameDay, formatDistanceToNow } from 'date-fns';
import { Calendar as CalendarIcon, CalendarDays, Eye, Store, Trees, TrafficCone, Clock, PlusCircle } from "lucide-react";
import { DateValue, getLocalTimeZone, today } from '@internationalized/date';


import { cn } from "@/lib/utils";
import { DashboardCard } from "@/components/dashboard-card";
import { AppHeader } from "@/components/header";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { EventProposalForm } from "@/components/event-proposal-form";

export default function Home() {
  const [selectedImageData, setSelectedImageData] = useState<{ src: string; alt: string; hint: string } | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsContent, setDetailsContent] = useState<{ title: string; description: string; content: React.ReactNode } | null>(null);
  const [roadDisruptionDate, setRoadDisruptionDate] = useState<DateValue | undefined>(today(getLocalTimeZone()));
  const [eventsDate, setEventDate] = useState<DateValue | undefined>(today(getLocalTimeZone()));
  
  type RoadDisruption = {
    id: string;
    title: string;
    description: string;
    date: Date;
    category: string;
    status: string;
  };

  type Events = {
    id: string;
    title: string;
    description: string;
    date: Date;
    location: string;
    status: string;
  };

  type ShopNotification = { 
    id: string; 
    name: string; 
    description: string; 
    opening: string;
    closing: string;
    status: string; 
    image: string; 
    hint: string
  };

  type ParkStatus = { 
    id: string; 
    name: string; 
    description: string
    opening: string;
    closing: string;
    status: string; 
    image: string; 
    hint: string
  };
  
  const [roadDisruptions, setRoadDisruptions] = useState<RoadDisruption[]>([]);
  const [loadingDisruptions, setLoadingDisruptions] = useState(true);

  const [localEvents, setEvents] = useState<Events[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [parkStatus, setParkStatus] = useState<ParkStatus[]>([]);
  const [loadingParkStatus, setLoadingParkStatus] = useState(true);

  const [shopNotifications, setShopNotifications] = useState<ShopNotification[]>([]);
  const [loadingShopNotifications, setLoadingShopNotifications] = useState(true);

  // Fetch Disruptions API
  useEffect(() => {
    const fetchDisruptions = async () => {
      setLoadingDisruptions(true);
      try {
        const disruptionsData = await api.get('/disruptions');

        const formattedDisruptions = disruptionsData.data
        .filter((post: any) => post.status === 'active')
        .map((post: any) => ({
          id: post._id,
          title: post.title,
          description: post.description,
          date: new Date(post.createdAt),
          category: post.category,
          status: post.status,
        }));
        setRoadDisruptions(formattedDisruptions);

      } catch (error) {
        console.error("Error fetching road disruptions:", error);
      } finally {
        setLoadingDisruptions(false);
      }
    };

    fetchDisruptions();
  }, []);

  // Fetch Shops API
  useEffect(() => {
    const fetchShopNotifications = async () => {
      setLoadingShopNotifications(true);
      try {
        const shopsData = await api.get('/shops');

        const formattedShops = shopsData.data
        .map((post: any) => ({
          id: post._id,
          name: post.name,
          description: post.description,
          opening: new Date(`1970-01-01T${post.openingHours.opening.slice(0,2)}:${post.openingHours.opening.slice(2,4)}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          closing: new Date(`1970-01-01T${post.openingHours.closing.slice(0,2)}:${post.openingHours.closing.slice(2,4)}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          status: post.status,
          image: `https://placehold.co/600x400.png?text=${post.name.replace(/\s+/g, '+')}`,
          hint: 'shop',
        }));
        setShopNotifications(formattedShops);
      } catch (error) {
        console.error("Error fetching shop notifications:", error);
      } finally {
        setLoadingShopNotifications(false);
      }
    };
    fetchShopNotifications();
  }, []);

  // Fetch Parks API
  useEffect(() => {
    const fetchParkStatus = async () => {
      setLoadingParkStatus(true);
      try {
        const parksData = await api.get('/parks');
        const formattedData = parksData.data
        .map((park: any) => ({
          id: park._id,
          name: park.name,
          description: park.description,
          opening: new Date(`1970-01-01T${park.openingHours.opening.slice(0,2)}:${park.openingHours.opening.slice(2,4)}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          closing: new Date(`1970-01-01T${park.openingHours.closing.slice(0,2)}:${park.openingHours.closing.slice(2,4)}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          status: park.status,
          image: `https://placehold.co/600x400.png?text=${park.name.replace(/\s+/g, '+')}`,
          hint: 'park',
        }));
        setParkStatus(formattedData);
      } catch (error) {
        console.error("Error fetching park status:", error);
      } finally {
        setLoadingParkStatus(false);
      }
    };
    fetchParkStatus();
  }, []);

  // Fetch Events API
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingDisruptions(true);
      setLoadingEvents(true);
      try {
        const eventsData = await api.get('/events');

        const formattedEvents = eventsData.data
        .filter((event: any) => event.status === 'approved')
        .map((event: any) => ({
          id: event._id,
          title: event.title,
          date: new Date(event.eventDate),
          location: event.location,
          description: event.description,
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Road Disruption date filer
  const filteredRoadDisruptions = useMemo(() => {
    if (!roadDisruptionDate) return [];
    const selectedJSDate = roadDisruptionDate.toDate(getLocalTimeZone());
    return roadDisruptions.filter((disruption) =>
      isSameDay(disruption.date, selectedJSDate)
    );
  }, [roadDisruptions, roadDisruptionDate]);

  // Events date filter
  const filteredEvents = useMemo(() => {
    if (!eventsDate) return [];
    const selectedJSDate = eventsDate.toDate(getLocalTimeZone());
    return localEvents.filter((event) =>
      isSameDay(event.date, selectedJSDate)
    );
  }, [localEvents, eventsDate]);

  const handleViewImage = (src: string, alt: string, hint: string) => {
    setSelectedImageData({ src, alt, hint });
    setImageDialogOpen(true);
  };

  const handleSeeMore = (title: string, description: string, content: React.ReactNode) => {
    setDetailsContent({ title, description, content });
    setDetailsOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex-1 p-3 md:p-6">
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedImageData?.alt || 'Image Preview'}</DialogTitle>
            </DialogHeader>
            {selectedImageData && (
              <img
                src={selectedImageData.src}
                alt="Sample Image"
                width={800}
                height={600}
                className="rounded-md object-cover w-full"
                data-ai-hint={selectedImageData.hint}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle data-speakable="true">{detailsContent?.title}</DialogTitle>
              <DialogDescription data-speakable="true">{detailsContent?.description}</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {detailsContent?.content}
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Road Disruptions Dashboard */}
          <DashboardCard
            title="Road Disruptions"
            icon={<TrafficCone className="h-6 w-6 text-destructive" />}
            description="Latest updates on traffic and road closures."
            onSeeMore={() => handleSeeMore(
              "All Road Disruptions",
              "Here are all the recent road disruptions from the past 7 days.",
              <ul className="space-y-4">
                {loadingDisruptions ? (
                   <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : roadDisruptions.length > 0 ? (roadDisruptions.map((disruption) => (
                  <li key={disruption.id} className="flex flex-col rounded-md border p-4" data-speakable="true">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{disruption.title}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(disruption.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{disruption.description}</span>
                  </li>
                ))) : (
                   <p data-speakable="true">No available data.</p>
                )}
              </ul>
            )}
          >
            <div className="flex flex-col gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !roadDisruptionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {roadDisruptionDate ? roadDisruptionDate.toString() : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    aria-label="Road disruption date"
                    value={roadDisruptionDate}
                    onChange={setRoadDisruptionDate}
                    minValue={today(getLocalTimeZone()).subtract({ days: 7 })}
                    maxValue={today(getLocalTimeZone())}
                  />
                </PopoverContent>
              </Popover>
            <ul className="space-y-4 rounded-md bg-destructive/10 p-4 min-h-[100px]">
              {loadingDisruptions ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : filteredRoadDisruptions.length > 0 ? (
                filteredRoadDisruptions.map((disruption: RoadDisruption) => (
                  <li key={disruption.id} className="space-y-1" data-speakable="true">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">{disruption.title}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(disruption.date, { addSuffix: true })}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{disruption.description}</span>
                  </li>
                ))
              ) : (
                <p data-speakable="true">No disruptions reported for this day.</p>
              )}
            </ul>
            </div>
          </DashboardCard>

          {/* Shops Dashboard */}
          <DashboardCard
            title="Shop Notifications"
            icon={<Store className="h-6 w-6 text-primary" />}
            description="News about local businesses."
            onSeeMore={() => handleSeeMore(
              "All Shop Notifications",
              "Here are all the recent notifications about local shops.",
              <ul className="space-y-4">
                {loadingShopNotifications ? (
                   <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : shopNotifications.length > 0 ? (shopNotifications.map((shop) => (
                  <li key={shop.id} className="flex flex-col rounded-md border p-4" data-speakable="true">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{shop.name}</span>
                        <Badge 
                          variant={
                            shop.status === 'open'
                              ? 'default'
                              : shop.status === 'maintenance'
                              ? 'secondary'
                              : 'outline' // For 'closed' or others
                          }
                          className={
                            shop.status === 'open'
                              ? 'bg-green-600'
                              : shop.status === 'maintenance'
                              ? 'bg-yellow-500'
                              : 'bg-red-600'
                          }>
                          {shop.status}
                        </Badge>
                    </div>
                    <span className="mt-1 flex items-center gap-2 text-sm">
                      <Clock className="w-4 text-muted-foreground" />
                      {shop.opening === '12:00 AM' && shop.closing === '12:00 AM'
                      ? '24 Hours'
                      : `${shop.opening} to ${shop.closing}`}
                    </span> 
                    <span className="text-xs text-muted-foreground">{shop.description}</span>
                  </li>
                ))) : (
                   <p data-speakable="true">No available data.</p>
                )}
              </ul>
            )}
          >
            {loadingShopNotifications ? (
              <div className="space-y-2">
               <Skeleton className="h-4 w-full" />
             </div>) : shopNotifications.length > 0 ? (
             <ul className="space-y-4">
              {shopNotifications.slice(0, 3).map((shop) => (
                <li key={shop.id} className="flex flex-col" data-speakable="true">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{shop.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                            shop.status === 'open'
                              ? 'default'
                              : shop.status === 'maintenance'
                              ? 'secondary'
                              : 'outline' // For 'closed' or others
                          }
                          className={
                            shop.status === 'open'
                              ? 'bg-green-600'
                              : shop.status === 'maintenance'
                              ? 'bg-yellow-500'
                              : 'bg-red-600'
                          }>
                        {shop.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewImage(shop.image, shop.name, shop.hint)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <span className="mt-1 flex items-center gap-2 text-sm">
                    <Clock className="w-4 text-muted-foreground" />
                    {shop.opening === '12:00 AM' && shop.closing === '12:00 AM'
                    ? '24 Hours'
                    : `${shop.opening} to ${shop.closing}`}
                  </span> 
                  <span className="text-xs text-muted-foreground">{shop.description}</span>
                </li>
              ))}
            </ul>
            ) : (
              <p data-speakable="true">No recent shop notifications.</p>
            )}          
          </DashboardCard>
          
          {/* Park Status Dashboard */}
          <DashboardCard
            title="Park Status"
            icon={<Trees className="h-6 w-6 text-green-600" />}
            description="Condition and availability of local parks."
            onSeeMore={() => handleSeeMore(
              "All Park Statuses",
              "Here are the latest statuses for all local parks.",
              <ul className="space-y-4">
                {loadingParkStatus ? (
                   <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : parkStatus.length > 0 ? (parkStatus.map((park) => (
                  <li key={park.id} className="rounded-md border p-4" data-speakable="true">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{park.name}</span>
                       <Badge
                          variant={
                            park.status === 'open'
                              ? 'default'
                              : park.status === 'maintenance'
                              ? 'secondary'
                              : 'outline' // For 'closed' or others
                          }
                          className={
                            park.status === 'open'
                              ? 'bg-green-600'
                              : park.status === 'maintenance'
                              ? 'bg-yellow-500'
                              : 'bg-red-600'
                          }
                        >
                          {park.status}
                        </Badge>
                    </div>
                    <div>
                      <p className="text-sm">{park.description}</p>
                      <span className="mt-2 flex items-center gap-2 text-sm">
                        <Clock className="w-4 text-muted-foreground" />
                        {park.opening === '12:00 AM' && park.closing === '12:00 AM'
                        ? '24 Hours'
                        : `${park.opening} to ${park.closing}`}
                      </span>
                    </div>
                  </li>
                ))) : (
                   <p data-speakable="true">No available data.</p>
                )}
              </ul>
            )}
          >
            {loadingParkStatus ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
              </div>) : parkStatus.length > 0 ? (
            <ul className="space-y-4">
              {parkStatus.slice(0, 3).map((park) => (
                <li key={park.id} data-speakable="true">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">{park.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            park.status === 'open'
                              ? 'default'
                              : park.status === 'maintenance'
                              ? 'secondary'
                              : 'outline'
                          }
                          className={
                            park.status === 'open'
                              ? 'bg-green-600'
                              : park.status === 'maintenance'
                              ? 'bg-yellow-500'
                              : 'bg-red-600'
                          }
                        >
                          {park.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewImage(park.image, park.name, park.hint)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                   </div>
                    <div>
                      <span className="mt-1 flex items-center gap-2 text-sm">
                        <Clock className="w-4 text-muted-foreground" />
                        {park.opening === '12:00 AM' && park.closing === '12:00 AM'
                        ? '24 Hours'
                        : `${park.opening} to ${park.closing}`}
                      </span>
                    </div>
                </li>
              ))}
            </ul>) : (
               <p data-speakable="true">No recent park status updates.</p>
            )}
          </DashboardCard>
          
          {/* Local Events Dashboard */}
          <DashboardCard
            title="Local Events"
            icon={<CalendarDays className="h-6 w-6 text-primary" />}
            description="Upcoming community events and ceremonies."
            headerActions={
              <Dialog>
                <DialogTrigger asChild>
                   <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Propose an Event
                    </Button>
                </DialogTrigger>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle data-speakable="true">Propose a New Event</DialogTitle>
                    <DialogDescription data-speakable="true">
                      Fill out the form below to propose a new community event. It will be reviewed by an administrator.
                    </DialogDescription>
                  </DialogHeader>
                  <EventProposalForm />
                </DialogContent>
              </Dialog>
            }
            onSeeMore={() => handleSeeMore(
              "All Local Events",
              "Here are all upcoming community events. Click the view icon for more details.",
              <ul className="space-y-4">
                {loadingEvents ? (
                   <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : localEvents.length > 0 ? 
                (localEvents.map((event: Events) => (
                   <li key={event.id} className="flex items-center justify-between rounded-md border p-4" data-speakable="true">
                    <div>
                      <p className="font-semibold text-sm">{event.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeeMore(
                      event.title,
                      `Event Details`,
                      <div className="space-y-2" data-speakable="true">
                        <p className="text-sm">{event.description}</p>
                        <p className="text-sm"><span className="font-semibold">Location:</span> {event.location}</p>
                        <p className="text-sm"><span className="font-semibold">Date:</span> {new Date(event.date).toLocaleDateString()}</p>
                      </div>
                    )}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </li>
                ))
                ) : (<p data-speakable="true">No available data.</p>
                )}
              </ul>

            )}
          >
            <div className="flex flex-col gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventsDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventsDate ? eventsDate.toString() : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    aria-label="Event date"
                    value={eventsDate}
                    onChange={setEventDate}
                    minValue={today(getLocalTimeZone())}
                  />
                </PopoverContent>
              </Popover>
              {loadingEvents ? (
                 <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                </div>
                ) : filteredEvents.length > 0 ? (
               <ul className="space-y-4">
                {filteredEvents.slice(0, 2).map((event) => (
                  <li key={event.id} className="flex items-center justify-between" data-speakable="true">
                    <div>
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeeMore(
                      event.title,
                      `Event Details`,
                      <div className="space-y-2" data-speakable="true">
                        <p className="text-sm">{event.description}</p>
                        <p className="text-sm"><span className="font-semibold">Location:</span> {event.location}</p>
                        <p className="text-sm"><span className="font-semibold">Date:</span> {new Date(event.date).toLocaleDateString()}</p>
                      </div>
                    )}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>) : (
                 <p data-speakable="true">No upcoming events on this date.</p>
              )}
            </div>
          </DashboardCard>
        </div>
      </main>
    </div>
  );
}

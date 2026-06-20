"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  DateValue,
  getLocalTimeZone,
  today,
} from "@internationalized/date";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const formSchema = z.object({
  eventName: z.string().min(1, "Event title is required.").max(100),
  description: z.string().min(1, "Description is required.").max(500),
  organizerName: z.string().min(2, "Your name is required."),
  organizerEmail: z.string().email("Please enter a valid email address."),
  eventDate: z.any().refine(val => val, { message: "Please select a date for the event." }),
  location: z.string().min(3, "Location is required."),
});

export function EventProposalForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: "",
      description: "",
      organizerName: "",
      organizerEmail: "",
      location: "",
      eventDate: null,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const inputObj = {
        ...values,
        eventDate: values.eventDate.toDate(getLocalTimeZone()).toISOString(),
    };
    try {
        const response = await api.post('/events', { inputObj });
        console.log('response?', response);
        if(response.status !== 200) {
          toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was a problem submitting your proposal. Please try again.",
          });
          form.reset();
          setIsSubmitting(false);
        } else {
          toast({
            title: "Proposal Submitted!",
            description: "Thank you for your submission. An administrator will review your proposal shortly.",
          });
          form.reset();
          setIsSubmitting(false);
        }
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message || "There was a problem submitting your proposal. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Neighborhood Spring Festival" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Event Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the event, what it's about, and who it's for."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="organizerName"
                render={({ field }) => (
                    <FormItem data-speakable="true">
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="organizerEmail"
                render={({ field }) => (
                    <FormItem data-speakable="true">
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Community Park Pavilion" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
                <FormItem className="flex flex-col" data-speakable="true">
                    <FormLabel>Proposed Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                field.value.toString()
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            aria-label="Proposed date"
                            value={field.value as DateValue | undefined}
                            onChange={field.onChange}
                            minValue={today(getLocalTimeZone())}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
        </Button>
      </form>
    </Form>
  );
}
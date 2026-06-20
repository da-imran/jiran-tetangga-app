"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  category: z.string().min(1, { message: "Please select a category." }),
  location: z.string().min(5, "Location details are required.").max(100),
  description: z.string().min(5, "Description is required.").max(250),
  photo: z.any().optional(),
});

export function IssueReportForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      location: "",
      description: "",
      category: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const { photo, ...payload } = values;

    try {
      await api.post('/reports', payload);
      toast({
        title: "Report Submitted!",
        description: "Thank you for your submission. Our administrators will review it shortly.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "There was a problem submitting your report. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Your Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., johndoe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an issue category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="road-disruption">Road Disruption</SelectItem>
                  <SelectItem value="park-issue">Park Issue</SelectItem>
                  <SelectItem value="shop-issue">Shop Issue</SelectItem>
                  <SelectItem value="local-event">Event Issue</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="lost-found">Lost &amp; Found</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jalan Merbuk, near the playground" {...field} />
              </FormControl>
              <FormDescription>
                Please provide a specific location or landmark.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the issue in detail."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem data-speakable="true">
              <FormLabel>Upload Photo (Optional)</FormLabel>
              <FormControl>
                <Input type="file" {...form.register("photo")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </form>
    </Form>
  );
}

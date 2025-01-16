'use client';

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Modal, { ModalPrimaryButton, ModalSecondaryButton } from '@/components/Modal';
import { Input } from '@/components/ui/input';
import { DatePicker } from "@/components/DatePicker"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Jam name must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
})

export default function CreateJamModal({ isOpen, onClose, onCreateJam }) {
  const [error, setError] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: undefined,
    },
  })

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values) {
    setError(null);

    try {
      const response = await fetch('/api/jams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          jamDate: values.date.toISOString(),
          songs: [] // Start with empty song list
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create jam');
      }

      const newJam = await response.json();
      onCreateJam(newJam);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Jam Session"
      actions={
        <>
          <ModalPrimaryButton 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Jam Session'}
          </ModalPrimaryButton>
          <ModalSecondaryButton onClick={onClose}>
            Cancel
          </ModalSecondaryButton>
        </>
      }
    >
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Name</FormLabel>
                <FormControl>
                  <Input placeholder="Friday Night Jazz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  When will this jam session take place?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Modal>
  );
} 
'use client';

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Modal, { ModalPrimaryButton, ModalSecondaryButton } from '@/components/Modal';
import { Input } from '@/components/ui/input';
import { DatePicker } from "@/components/DatePicker"
import { createJam } from '@/lib/services/jams';
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
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time portion to midnight

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: today,
    },
  })

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values) {
    setError(null);

    try {
      const newJam = await createJam({
        name: values.name,
        jamDate: values.date.toISOString(),
        songs: [] // Start with empty song list
      });
      
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
                <FormLabel>Date of the jam session</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Modal>
  );
} 
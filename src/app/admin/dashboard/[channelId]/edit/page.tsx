'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/ui/icons"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Channel name must be at least 2 characters.",
  }),
  description: z.string().max(500, {
    message: "Description must not exceed 500 characters.",
  }),
})

export default function EditChannel() {
  const router = useRouter()
  const params = useParams()
  const channelId = params?.channelId as string
  const [isLoading, setIsLoading] = useState(true)
  const [logo, setLogo] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null)
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null)
  const [previewBannerUrl, setPreviewBannerUrl] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    const fetchChannelData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/channels/${channelId}`)
        if (response.ok) {
          const data = await response.json()
          form.reset({
            name: data.name,
            description: data.description,
          })
          if(data.logo) {
            setPreviewLogoUrl(`${data.logo}`)
          } else {
            setPreviewLogoUrl(null)
          }
          if(data.banner) {
            setPreviewBannerUrl(`${data.banner}`)
          } else {
            setPreviewBannerUrl(null)
          }
        } else {
          throw new Error('Failed to fetch channel data')
        }
      } catch (error) {
        console.error('Error fetching channel data:', error)
        toast.error("Failed to load channel data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannelData()
  }, [channelId, form])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBanner(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewBannerUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('description', values.description)
      if (logo) {
        formData.append('logo', logo)
      }
      if (banner) {
        formData.append('banner', banner)
      }
      formData.append('channelName', values.name)

      const response = await fetch(`/api/admin/channels/${channelId}`, {
        method: 'PUT',
        body: formData,
      })

      if (response.ok) {
        toast.success("Channel updated successfully.")
        setTimeout(() => {
          router.push('/admin/channels')
        }, 1500)
      } else {
        throw new Error('Failed to update channel')
      }
    } catch (error) {
      console.error('Error updating channel:', error)
      toast.error("Failed to update channel. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Channel</CardTitle>
            <CardDescription>Loading channel data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <Card>
        <CardHeader>
          <CardTitle>Edit Channel</CardTitle>
          <CardDescription>Make changes to your channel here. Click save when you&apos;re done.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter channel name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public channel name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter channel description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe your channel. This will be visible to your subscribers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Channel Logo</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      Replace Logo
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={logoInputRef}
                      onChange={handleLogoChange}
                    />
                    {previewLogoUrl && previewLogoUrl !== null && (
                      <div className="relative w-16 h-16">
                        <Image
                          src={previewLogoUrl}
                          alt="Channel logo"
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload a new logo or keep the existing one.
                </FormDescription>
              </FormItem>
              <FormItem>
                <FormLabel>Channel Banner</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      Replace Banner
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={bannerInputRef}
                      onChange={handleBannerChange}
                    />
                    {previewBannerUrl && previewBannerUrl !== null && (
                      <div className="relative w-32 h-16">
                        <Image
                          src={previewBannerUrl}
                          alt="Channel banner"
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload a new banner or keep the existing one.
                </FormDescription>
              </FormItem>
              <div className="flex justify-between">
                <Button type="submit">
                  <Icons.save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/channels">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
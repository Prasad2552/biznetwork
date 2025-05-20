'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts'

interface ContentCounts {
  videos: number
  blogs: number
  webinars: number
  podcasts: number
  caseStudies: number
  infographics: number
  whitePapers: number
  testimonials: number
  ebooks: number
  demos: number
  events: number
}

interface ChannelData {
  _id: string;
  name: string;
  description: string;
  subscribers: number;
  engagements: number;
  logo: string;
  videoCount: number;
  blogCount: number;
  webinarCount: number;
  podcastCount: number;
  caseStudyCount: number;
  infographicCount: number;
  whitePaperCount: number;
  testimonialCount: number;
  ebookCount: number;
  demoCount: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
    contentCounts: ContentCounts
}

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40', '#FF6384'
]

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <text
        x={cx + (outerRadius + 10) * Math.cos(-endAngle * Math.PI / 180)}
        y={cy + (outerRadius + 10) * Math.sin(-endAngle * Math.PI / 180)}
        textAnchor={endAngle > 90 && endAngle < 270 ? 'end' : 'start'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${payload.name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  )
}

export default function ChannelDashboard() {
  const params = useParams()
  const channelId = params?.channelId as string
  const [channelData, setChannelData] = useState<ChannelData | null>(null)

  useEffect(() => {
    const fetchChannelData = async () => {
      const response = await fetch(`/api/admin/channels/${channelId}`)
      const data = await response.json()
      setChannelData(data)
    }

    fetchChannelData()
  }, [channelId])


  if (!channelData ) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalContent = Object.values(channelData.contentCounts).reduce((a, b) => a + b, 0)
  const chartData = Object.entries(channelData.contentCounts)
    .map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }))
    .sort((a, b) => b.value - a.value)


  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{channelData.name} Channel Dashboard</h1>
        <div className="space-x-4">
          <Button asChild variant="outline">
            <Link href={`/admin/dashboard/${channelId}/content`}>
              <Icons.list className="mr-2 h-4 w-4" /> Uploaded Content
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/dashboard/${channelId}/upload`}>
              <Icons.upload className="mr-2 h-4 w-4" /> Upload New Content
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>Channel Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Total Subscribers</p>
              <p className="text-3xl font-bold">{channelData.subscribers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Content</p>
              <p className="text-3xl font-bold">{totalContent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Engagement Rate</p>
              <p className="text-3xl font-bold">
                {((channelData.engagements / channelData.subscribers) * 100).toFixed(2)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                  <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                     label={({ name, value, percent }) =>
                       value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                     }
                  >
                    {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                  </Pie>
                    <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{
                         paddingTop: '20px'
                       }}
                    />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {Object.entries(channelData.contentCounts).map(([type, count]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <span className="text-2xl font-bold">{count}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(count / totalContent) * 100} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {((count / totalContent) * 100).toFixed(1)}% of total content
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
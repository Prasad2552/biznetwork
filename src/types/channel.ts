//src\types\channel.ts

export interface Channel {
  _id: string
  name: string
  description: string
  subscribers: number
  engagements: number
  logo: string
  banner: string
  videoCount: number
  blogCount: number
  webinarCount: number
  channelName: string
  podcastCount: number
  caseStudyCount: number
  infographicCount: number
  whitePaperCount: number
  testimonialCount: number
  ebookCount: number
  demoCount: number
  eventCount: number
  techNewsCount: number
  createdAt: string
  updatedAt: string
  v: number
}
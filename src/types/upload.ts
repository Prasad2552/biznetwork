export interface UploadProps {
  channelId: string;
contentType?: string;
}

export interface VideoDetails {
  title: string;
  description: string;
  categories: string[];
  selectedCategory?: string;
}

export interface BlogPost {
  title: string;
  content: string;
  featuredImage?: File | null;
}

export interface CaseStudy {
  title: string;
  content: string;
  featuredImage?: string | null; // Change to string
  slug: string;
  channelId: string;
}

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}
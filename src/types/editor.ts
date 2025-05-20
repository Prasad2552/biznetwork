

export interface EditorRef {
  getContent: () => string;
}

export type EditorProps = {
  onInit: (evt: any, editor: EditorRef) => void;
  initialValue: string;
  init: {
    height: number;
    menubar: boolean;
    plugins: string[];
    toolbar: string;
    content_style: string;
    images_upload_url?: string;
    images_upload_handler?: (blobInfo: {
      blob: () => Blob;
      filename: () => string;
    }, progress: (percent: number) => void) => Promise<string>;
  };
}


export interface Media {
    id: number;
    url: string;
    name: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
    formats?: any;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    previewUrl?: string;
    provider: string;
    provider_metadata?: any;
}
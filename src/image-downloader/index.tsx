"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ImageDownloaderComponent = () => {
  const [url, setUrl] = useState("");
  const [width, setWidth] = useState("720");
  const [height, setHeight] = useState("720");
  const [isLoading, setIsLoading] = useState(false);

  const extractUrl = (input: string): string => {
    // First, try to clean the input if it looks like a JSON string with extra quotes
    let cleanedInput = input.trim();
    
    // Handle the case where the input is a JSON string with extra quotes
    if (cleanedInput.startsWith('"') && cleanedInput.endsWith('"')) {
      try {
        cleanedInput = JSON.parse(cleanedInput);
      } catch {
        // If parsing fails, continue with the original input
      }
    }

    // If the cleaned input is a URL, return it directly
    try {
      new URL(cleanedInput);
      return cleanedInput;
    } catch {
      // Not a valid URL, try to parse as JSON object
    }

    // Try to parse as JSON object
    try {
      // Try to parse the entire input as JSON
      const parsed = typeof cleanedInput === 'string' ? JSON.parse(cleanedInput) : cleanedInput;
      
      if (typeof parsed === 'object' && parsed !== null) {
        // Look for common URL fields in the object
        const possibleUrlFields = ['url', 'image', 'image_url', 'imageUrl', 'src', 'image_webp'];
        for (const field of possibleUrlFields) {
          const value = parsed[field];
          if (typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
    } catch (e) {
      // If JSON parsing fails, try to extract URL using regex
      const urlMatch = cleanedInput.match(/https?:\/\/[^\s"']+/);
      if (urlMatch) {
        return urlMatch[0];
      }
    }
    
    // If we get here, return the original input
    return input;
  };

  const modifyImageUrl = (originalUrl: string, newWidth: string, newHeight: string): { url: string; error?: string } => {
    try {
      // First, check if the input is empty
      if (!originalUrl.trim()) {
        return { url: '', error: 'Please enter a URL' };
      }

      // Extract URL from potential JSON input
      const extractedUrl = extractUrl(originalUrl);
      
      // Check if the extracted URL is empty or just whitespace
      if (!extractedUrl.trim()) {
        return { url: '', error: 'No valid URL found in the input' };
      }

      // Validate URL format
      let urlObj;
      try {
        urlObj = new URL(extractedUrl);
      } catch (e) {
        // If URL is invalid, check if it's missing http/https and try to add it
        if (!extractedUrl.match(/^https?:\/\//)) {
          try {
            urlObj = new URL(`https://${extractedUrl}`);
          } catch (e) {
            return { url: extractedUrl, error: 'Invalid URL format. Please include http:// or https://' };
          }
        } else {
          return { url: extractedUrl, error: 'Invalid URL format' };
        }
      }

      // Proceed with URL modification
      const params = new URLSearchParams(urlObj.search);
      
      // Update or add width and height parameters
      if (newWidth) params.set('width', newWidth);
      if (newHeight) params.set('height', newHeight);
      
      urlObj.search = params.toString();
      return { url: urlObj.toString() };
    } catch (error) {
      console.error("Error processing URL:", error);
      return { url: originalUrl, error: 'Failed to process URL' };
    }
  };

  const handleDownload = async () => {
    if (!url) {
      toast.error("Please enter an image URL");
      return;
    }

    if (!width && !height) {
      toast.error("Please specify at least width or height");
      return;
    }

    setIsLoading(true);
    
    try {
      // Get modified URL and check for errors
      const { url: modifiedUrl, error } = modifyImageUrl(url, width, height);
      
      if (error || !modifiedUrl) {
        toast.error(error || 'Invalid URL');
        return;
      }
      
      // Fetch the image as a blob
      const response = await fetch(modifiedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Get file extension from URL or default to jpg
      const urlObj = new URL(modifiedUrl);
      const pathParts = urlObj.pathname.split('.');
      const extension = pathParts.length > 1 ? pathParts.pop()?.split('?')[0] : 'jpg';
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `image-${width}x${height || 'auto'}-${Date.now()}.${extension || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-screen p-4">
      <div className="flex flex-col gap-4 w-full max-w-md p-6 border rounded-lg bg-card shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Image Downloader</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="image-url" className="block text-sm font-medium mb-1">
              Image URL <span className="text-red-500">*</span>
            </label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="width" className="block text-sm font-medium mb-1">
                Width (px)
              </label>
              <Input
                id="width"
                type="number"
                min="1"
                placeholder="e.g., 800"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-1">
                Height (px)
              </label>
              <Input
                id="height"
                type="number"
                min="1"
                placeholder="e.g., 600"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleDownload}
            disabled={isLoading || !url || (!width && !height)}
            className="w-full mt-2"
          >
            {isLoading ? 'Downloading...' : 'Download Image'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Note: The image will be downloaded with the specified dimensions if the source supports it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageDownloaderComponent;

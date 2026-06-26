"use client";

import Image, { ImageOptions } from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, RefreshCw, Loader2, GripHorizontal, Crop as CropIcon } from 'lucide-react';
import { uploadImage } from '../actions/upload-image.action';
import { toast } from 'sonner';
import ReactCrop, { type Crop as ReactCropType } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Helper to get cropped image blob
async function getCroppedImg(image: HTMLImageElement, crop: ReactCropType): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 1);
  });
}

const ResizableImageNode = (props: NodeViewProps) => {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { src, alt, title, width, height } = node.attrs;

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'both' | 'width' | 'height' | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const initialWidthRef = useRef(0);
  const initialHeightRef = useRef(0);

  // Crop State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [crop, setCrop] = useState<ReactCropType>({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
  const [completedCrop, setCompletedCrop] = useState<ReactCropType | null>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = useState(false);

  const startResize = (e: React.MouseEvent, direction: 'both' | 'width' | 'height') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    if (imgRef.current) {
      initialWidthRef.current = imgRef.current.clientWidth;
      initialHeightRef.current = imgRef.current.clientHeight;
    }
  };

  const documentId = props.extension.options.documentId;

  const handleImageReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && documentId) {
      const toastId = toast.loading("Replacing image...");
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        
        const result = await uploadImage(documentId, formData);
        
        if (result.error) {
          toast.error(result.error, { id: toastId });
        } else if (result.success && result.publicUrl) {
          updateAttributes({ src: result.publicUrl, width: null, height: null });
          toast.success("Image replaced", { id: toastId });
        }
      } catch {
        toast.error("Failed to replace image", { id: toastId });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !cropImgRef.current || !documentId) return;
    
    // Only crop if there is actual dimension
    if (completedCrop.width === 0 || completedCrop.height === 0) return;

    try {
      setIsCropping(true);
      const toastId = toast.loading("Applying crop...");
      const croppedBlob = await getCroppedImg(cropImgRef.current, completedCrop);
      
      const file = new File([croppedBlob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append("file", file);
      
      const result = await uploadImage(documentId, formData);
      
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else if (result.success && result.publicUrl) {
        updateAttributes({ src: result.publicUrl, width: completedCrop.width, height: completedCrop.height });
        toast.success("Image cropped successfully", { id: toastId });
        setIsCropModalOpen(false);
      }
    } catch (e) {
      toast.error("Failed to crop image");
    } finally {
      setIsCropping(false);
    }
  };

  const triggerImageReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const openCropModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCropModalOpen(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    let newWidth = initialWidthRef.current;
    let newHeight = initialHeightRef.current;

    if (resizeDirection === 'both') {
      if (!e.shiftKey) {
        // preserve ratio by default unless shift is pressed
        const ratio = initialWidthRef.current / initialHeightRef.current;
        newWidth = Math.max(50, initialWidthRef.current + dx);
        newHeight = Math.max(50, newWidth / ratio);
      } else {
        // free form
        newWidth = Math.max(50, initialWidthRef.current + dx);
        newHeight = Math.max(50, initialHeightRef.current + dy);
      }
    } else if (resizeDirection === 'width') {
      newWidth = Math.max(50, initialWidthRef.current + dx);
    } else if (resizeDirection === 'height') {
      newHeight = Math.max(50, initialHeightRef.current + dy);
    }

    updateAttributes({
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    });
  }, [isResizing, resizeDirection, updateAttributes]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <>
      <NodeViewWrapper 
        as="span"
        className={`group relative inline-block align-bottom m-1 ${selected ? 'outline outline-2 outline-blue-500 outline-offset-2' : ''}`}
        style={{ display: 'inline-block' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          title={title}
          width={width}
          height={height}
          className="max-w-full rounded-sm transition-shadow"
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
          }}
          draggable={true}
          data-drag-handle
        />
        
        {/* Drag Handle Overlay */}
        {selected && (
          <div 
            className="absolute top-2 left-2 p-1 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-md shadow-sm z-30 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-800 transition-colors"
            data-drag-handle
            title="Drag to move"
          >
            <GripHorizontal className="w-4 h-4" />
          </div>
        )}

        {/* Floating Action Menu */}
        {selected && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-lg shadow-md z-30 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={triggerImageReplace}
              disabled={isUploading}
              className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-700 transition-colors disabled:opacity-50"
              title="Replace Image"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            
            <div className="w-px h-4 bg-zinc-200 mx-0.5" />
            
            <button
              onClick={openCropModal}
              className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-700 transition-colors"
              title="Crop Image"
            >
              <CropIcon className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-zinc-200 mx-0.5" />
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode();
              }}
              disabled={isUploading}
              className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md text-zinc-700 transition-colors disabled:opacity-50"
              title="Delete Image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageReplace}
          accept="image/*"
          className="hidden"
        />
        
        {/* Resizing Handles */}
        {selected && (
          <>
            {/* Right Handle */}
            <div
              className="absolute top-1/2 -right-1.5 w-3 h-8 bg-white border border-blue-500 rounded-sm cursor-e-resize -translate-y-1/2 z-20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => startResize(e, 'width')}
            />
            {/* Bottom Handle */}
            <div
              className="absolute -bottom-1.5 left-1/2 w-8 h-3 bg-white border border-blue-500 rounded-sm cursor-s-resize -translate-x-1/2 z-20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => startResize(e, 'height')}
            />
            {/* Bottom-Right Handle */}
            <div
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize z-20 shadow-sm"
              onMouseDown={(e) => startResize(e, 'both')}
            />
          </>
        )}
      </NodeViewWrapper>

      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-zinc-50 rounded-md overflow-hidden p-4 max-h-[60vh]">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImgRef}
                src={src}
                alt="Crop preview"
                className="max-h-[50vh] object-contain"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropModalOpen(false)} disabled={isCropping}>
              Cancel
            </Button>
            <Button onClick={handleCropComplete} disabled={isCropping}>
              {isCropping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ResizableImage = Image.extend<ImageOptions & { documentId?: string }>({
  addOptions() {
    return {
      ...this.parent?.(),
      documentId: undefined,
    }
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});

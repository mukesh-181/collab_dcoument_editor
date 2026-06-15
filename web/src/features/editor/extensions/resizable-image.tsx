"use client";

import Image, { ImageOptions } from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { uploadImage } from '../actions/upload-image.action';
import { toast } from 'sonner';

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
          updateAttributes({ src: result.publicUrl });
          toast.success("Image replaced", { id: toastId });
        }
      } catch (error) {
        toast.error("Failed to replace image", { id: toastId });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const triggerImageReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    let newWidth = initialWidthRef.current;
    let newHeight = initialHeightRef.current;

    if (resizeDirection === 'both') {
      const ratio = initialWidthRef.current / initialHeightRef.current;
      newWidth = Math.max(50, initialWidthRef.current + dx);
      newHeight = Math.max(50, newWidth / ratio);
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
    <NodeViewWrapper 
      as="span"
      className={`group relative inline-block ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      style={{ display: 'inline-block', lineHeight: 0 }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        className="max-w-full"
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
        }}
        draggable={false} // Prevent native drag to allow our custom resize logic
      />
      {selected && (
        <>
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <button
              onClick={triggerImageReplace}
              disabled={isUploading}
              className="bg-white text-zinc-700 p-1.5 rounded-md hover:bg-zinc-100 shadow-sm border border-zinc-200 disabled:opacity-50"
              title="Replace Image"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode();
              }}
              className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 shadow-sm disabled:opacity-50"
              title="Delete Image"
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageReplace}
            accept="image/*"
            className="hidden"
          />
          
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize translate-x-1/2 translate-y-1/2 z-10 rounded-sm"
            onMouseDown={(e) => startResize(e, 'both')}
          />
          <div
            className="absolute bottom-0 left-1/2 w-3 h-3 bg-blue-500 cursor-s-resize -translate-x-1/2 translate-y-1/2 z-10 rounded-sm"
            onMouseDown={(e) => startResize(e, 'height')}
          />
          <div
            className="absolute top-1/2 right-0 w-3 h-3 bg-blue-500 cursor-e-resize translate-x-1/2 -translate-y-1/2 z-10 rounded-sm"
            onMouseDown={(e) => startResize(e, 'width')}
          />
        </>
      )}
    </NodeViewWrapper>
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

import { DocumentHeader } from "@/features/document/components/page/document-header";
import { DocumentProvider } from "@/features/document/components/page/document-context";
import { DocumentClientLayout } from "@/features/document/components/page/document-client-layout";
import { DocumentRealtimeListener } from "@/features/document/components/page/document-realtime-listener";
import { LazyEditor } from "@/features/editor/components/lazy-editor";
import { PageThumbnails } from "@/features/editor/components/page-thumbnails";

interface DocData {
  id: string;
  title: string;
  updated_at: string;
  all_members?: Array<{ role: string; user: { id: string; name: string; image: string; email: string } }>;
  invites?: Record<string, unknown>[];
  [key: string]: unknown;
}

interface DocumentPageProps {
  document: DocData;
  documents: DocData[];
  currentUserRole: string;
  currentUserName: string;
  currentUserImage?: string;
  token: string;
}

export function DocumentPage({
  document,
  documents,
  currentUserRole,
  currentUserName,
  currentUserImage,
  token,
}: DocumentPageProps) {
  return (
    <DocumentProvider initialRole={currentUserRole}>
      <DocumentRealtimeListener documentId={document.id} />
      <DocumentHeader document={document} documents={documents} currentUserName={currentUserName} />
      <DocumentClientLayout>
        <div className="flex flex-1 w-full relative">
          <PageThumbnails />
          <div className="flex-1 w-full pb-32 flex flex-col items-center">
            <LazyEditor
              documentId={document.id}
              currentUserName={currentUserName}
              currentUserImage={currentUserImage}
              token={token}
              initialYdocState={(document.document_content_state as any)?.ydoc_state}
            />
          </div>
        </div>
      </DocumentClientLayout>
    </DocumentProvider>
  );
}

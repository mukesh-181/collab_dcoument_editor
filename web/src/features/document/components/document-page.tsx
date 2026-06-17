import { DocumentHeader } from "@/features/document/components/page/document-header";
import { DocumentProvider } from "@/features/document/components/page/document-context";
import { DocumentClientLayout } from "@/features/document/components/page/document-client-layout";
import { DocumentRealtimeListener } from "@/features/document/components/page/document-realtime-listener";
import { LazyEditor } from "@/features/editor/components/lazy-editor";
import { PageThumbnails } from "@/features/editor/components/page-thumbnails";

interface DocumentPageProps {
  document: any;
  documents: any[];
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
              documentTitle={document.title}
              currentUserName={currentUserName}
              currentUserImage={currentUserImage}
              token={token}
            />
          </div>
        </div>
      </DocumentClientLayout>
    </DocumentProvider>
  );
}

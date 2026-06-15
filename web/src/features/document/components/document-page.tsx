import { DocumentHeader } from "@/features/document/components/page/document-header";
import { DocumentProvider } from "@/features/document/components/page/document-context";
import { DocumentClientLayout } from "@/features/document/components/page/document-client-layout";
import { DocumentRealtimeListener } from "@/features/document/components/page/document-realtime-listener";
import { Editor } from "@/features/editor/components/editor";

interface DocumentPageProps {
  document: any;
  documents: any[];
  currentUserRole: string;
  currentUserName: string;
  token: string;
}

export function DocumentPage({
  document,
  documents,
  currentUserRole,
  currentUserName,
  token,
}: DocumentPageProps) {
  return (
    <DocumentProvider>
      <DocumentClientLayout>
        <DocumentRealtimeListener documentId={document.id} />
        <DocumentHeader document={document} documents={documents} currentUserRole={currentUserRole} currentUserName={currentUserName} />
        <div className="flex-1 overflow-y-auto relative min-h-0">
          <Editor
            documentId={document.id}
            documentTitle={document.title}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            token={token}
          />
        </div>
      </DocumentClientLayout>
    </DocumentProvider>
  );
}

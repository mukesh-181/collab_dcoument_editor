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
    <DocumentProvider initialRole={currentUserRole}>
      <DocumentClientLayout>
        <DocumentRealtimeListener documentId={document.id} />
        <DocumentHeader document={document} documents={documents} currentUserName={currentUserName} />
        <div className="flex-1 w-full pb-32 flex flex-col items-center">
          <Editor
            documentId={document.id}
            documentTitle={document.title}
            currentUserName={currentUserName}
            token={token}
          />
        </div>
      </DocumentClientLayout>
    </DocumentProvider>
  );
}

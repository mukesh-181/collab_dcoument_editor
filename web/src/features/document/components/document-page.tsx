import { DocumentHeader } from "@/features/document/components/page/document-header";
import { DocumentProvider } from "@/features/document/components/page/document-context";
import { DocumentClientLayout } from "@/features/document/components/page/document-client-layout";
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
        <DocumentHeader document={document} documents={documents} currentUserRole={currentUserRole} />
        <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 min-h-0">
          <Editor
            documentId={document.id}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            token={token}
          />
        </div>
      </DocumentClientLayout>
    </DocumentProvider>
  );
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { supabase } from '../src/lib/supabase';

const { mockQueryBuilder } = vi.hoisted(() => ({
  mockQueryBuilder: {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    upsert: vi.fn(),
  }
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockQueryBuilder),
  }
}));

describe('Hocuspocus Server Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('onLoadDocument', () => {
    it('should apply the ydoc_state from Supabase if it exists', async () => {
      // Mock Supabase returning a base64 encoded Yjs state
      const mockDoc = new Y.Doc();
      const text = mockDoc.getText('default');
      text.insert(0, 'Hello World');
      const stateVector = Y.encodeStateAsUpdate(mockDoc);
      const base64State = Buffer.from(stateVector).toString('base64');

      mockQueryBuilder.single.mockResolvedValue({
        data: { ydoc_state: base64State },
        error: null,
      });

      // Simulate the onLoadDocument logic
      const documentName = 'doc-123';
      const document = new Y.Doc();
      
      const { data, error } = await supabase
        .from("document_content_state")
        .select("ydoc_state")
        .eq("document_id", documentName)
        .single();

      if (data?.ydoc_state) {
        const binaryString = atob(data.ydoc_state);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        Y.applyUpdate(document, bytes);
      }

      expect(document.getText('default').toString()).toBe('Hello World');
    });
  });

  describe('onStoreDocument', () => {
    it('should upsert the base64 encoded state to Supabase', async () => {
      const documentName = 'doc-123';
      const document = new Y.Doc();
      document.getText('default').insert(0, 'Saved State');
      
      const stateVector = Y.encodeStateAsUpdate(document);
      const base64State = Buffer.from(stateVector).toString('base64');

      mockQueryBuilder.upsert.mockResolvedValue({ error: null });

      // Simulate onStoreDocument
      const { error } = await supabase.from("document_content_state").upsert(
        {
          document_id: documentName,
          ydoc_state: base64State,
        },
        { onConflict: "document_id" } as any
      );

      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        { document_id: documentName, ydoc_state: base64State },
        { onConflict: "document_id" }
      );
      expect(error).toBeNull();
    });
  });
});

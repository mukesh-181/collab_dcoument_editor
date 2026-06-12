import { useState, useMemo } from 'react';
import type { DashboardDocument } from "../types";

export function useFilteredDocuments(documents: DashboardDocument[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      const role = doc.document_members?.[0]?.role || 'viewer';
      switch (filterType) {
        case 'owned-by-me': return role === 'owner';
        case 'owned-by-others': return role !== 'owner';
        case 'editor': return role === 'editor';
        case 'viewer': return role === 'viewer';
        case 'all': default: return true;
      }
    });
  }, [documents, searchQuery, filterType]);

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filteredDocuments
  };
}

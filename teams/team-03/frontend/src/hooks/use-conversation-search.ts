"use client";

import { useMemo } from "react";

import { useConversations } from "@/hooks/use-conversations";

export function useConversationSearch() {
  const { searchQuery, setSearchQuery, filteredConversations, conversations } =
    useConversations();

  const hasResults = filteredConversations.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  const resultCount = useMemo(
    () => filteredConversations.length,
    [filteredConversations],
  );

  return {
    searchQuery,
    setSearchQuery,
    filteredConversations,
    conversations,
    hasResults,
    isSearching,
    resultCount,
    clearSearch: () => setSearchQuery(""),
  };
}

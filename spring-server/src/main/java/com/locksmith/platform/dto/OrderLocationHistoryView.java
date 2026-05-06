package com.locksmith.platform.dto;

public record OrderLocationHistoryView(
        String adminName,
        String processingStatus,
        String locationNote,
        String createdAt
) {
}

package com.snipxn.note.util;

public final class MarkdownUtils {

    private MarkdownUtils() {
    }

    public static String buildSummary(String content) {
        if (content == null) {
            return "";
        }
        String plain = content.replaceAll("```[\\s\\S]*?```", "")
                .replaceAll("[#*>`~\\[\\]()!|-]", "")
                .replaceAll("\\s+", " ")
                .trim();
        return plain.length() > 200 ? plain.substring(0, 200) : plain;
    }
}

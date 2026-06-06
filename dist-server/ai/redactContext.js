const patterns = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]"],
    [/\+?\d[\d\s().-]{7,}\d/g, "[redacted-phone]"],
    [/\b(?:acct|account|transaction|txn|ref)[\s:#-]*[A-Z0-9-]{5,}\b/gi, "[redacted-id]"]
];
export function redactText(input) {
    return patterns.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), input);
}
export function redactContextForPrompt(context, maxChars) {
    const text = JSON.stringify(context, (_key, value) => {
        if (typeof value !== "string")
            return value;
        return redactText(value);
    });
    return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
}

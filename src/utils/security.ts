export function sanitizeInput(input: string | null | undefined): string {
    if (!input) return '';
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;')
        .replace(/\\/g, '&#x5C;')
        .replace(/`/g, '&#96;')
        .trim();
}

// XSS prevention for HTML content
export function sanitizeHTML(html: string): string {
    const allowedTags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br'];
    const allowedAttributes = ['class', 'style'];
    
    return html.replace(/<[^>]*>/g, tag => {
        const tagName = tag.match(/<\/?([^\s>]+)/)?.[1]?.toLowerCase();
        if (!tagName || !allowedTags.includes(tagName)) return '';

        const attributes = Array.from(tag.matchAll(/(\w+)=["']([^"']*)["']/g))
            .filter(attr => allowedAttributes.includes(attr[1].toLowerCase()))
            .map(attr => `${attr[1]}="${attr[2]}"`)
            .join(' ');

        return `<${tagName}${attributes ? ' ' + attributes : ''}>`;
    });
}
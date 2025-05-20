export const FILE_SIGNATURES = {
    pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
    jpeg: new Uint8Array([0xFF, 0xD8, 0xFF]),
    png: new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    webp: new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
    gif: new Uint8Array([0x47, 0x49, 0x46, 0x38]),
};

export function validateMagicNumbers(
    buffer: Uint8Array,
    expectedSignature: Uint8Array
): boolean {
    if (buffer.length < expectedSignature.length) return false;
    
    const slice = buffer.slice(0, expectedSignature.length);
    return Array.from(slice).every(
        (byte, index) => byte === expectedSignature[index]
    );
}
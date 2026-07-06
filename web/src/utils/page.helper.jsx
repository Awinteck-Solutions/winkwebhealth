export const capitalizeWords = (text) => {
    return text.replace(/\b\w/g, char => char.toUpperCase());
}

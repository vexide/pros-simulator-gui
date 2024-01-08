/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.svelte"],
    theme: {
        extend: {
            fontFamily: {
                "lcd-sans": ["DejaVu Sans", "sans-serif"],
                "lcd-mono": ["DejaVu Mono", "monospace"],
            },
        },
    },
    plugins: [],
};

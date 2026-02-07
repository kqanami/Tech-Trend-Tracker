/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Cosmic theme colors
                cosmic: {
                    50: '#f0f4ff',
                    100: '#e0e9ff',
                    200: '#c7d7fe',
                    300: '#a4bcfe',
                    400: '#8195fc',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                nebula: {
                    50: '#fdf4ff',
                    100: '#fae8ff',
                    200: '#f5d0fe',
                    300: '#f0abfc',
                    400: '#e879f9',
                    500: '#d946ef',
                    600: '#c026d3',
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75',
                    950: '#4a044e',
                },
                space: {
                    50: '#f7f7f8',
                    100: '#eeeef0',
                    200: '#d9d9de',
                    300: '#b8b8c1',
                    400: '#92929f',
                    500: '#747485',
                    600: '#5e5e6d',
                    700: '#4d4d59',
                    800: '#42424b',
                    900: '#1a1a2e',
                    950: '#0f0f1e',
                },
            },
            backgroundImage: {
                'cosmic-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'nebula-gradient': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'space-gradient': 'linear-gradient(to bottom, #0f0f1e, #1a1a2e, #0f0f1e)',
                'aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
            boxShadow: {
                'cosmic': '0 0 30px rgba(99, 102, 241, 0.3)',
                'nebula': '0 0 30px rgba(217, 70, 239, 0.3)',
                'glow': '0 0 20px rgba(255, 255, 255, 0.1)',
            },
        },
    },
    plugins: [],
}

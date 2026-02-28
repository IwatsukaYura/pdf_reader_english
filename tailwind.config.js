/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
    theme: {
        extend: {
            colors: {
                highlight: {
                    yellow: '#FFF176',
                    green: '#B9F6CA',
                    pink: '#FCE4EC',
                    cyan: '#E0F7FA'
                }
            }
        }
    },
    plugins: [require('@tailwindcss/typography')]
}

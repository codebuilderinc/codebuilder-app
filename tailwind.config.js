/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}", // Ensure all router files are included
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

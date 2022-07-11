/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
			colors: {
				primary: {
						DEFAULT: '#15357d',
						light: '#3163c6',
					},
			},
	},
  },
  plugins: [],
};

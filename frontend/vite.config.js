import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // MUST match your exact repository name on GitHub
  base: '/project/', 
})



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   // Needed for GitHub Pages production build
//   base: '/project/', // Replace with your exact GitHub repository name
  
//   // Used only during local development (npm run dev)
//   server: {
//     port: 5173,
//     proxy: {
//       '/api': {
//         target: 'http://127.0.0.1:8000',
//         changeOrigin: true,
//       },
//     },
//   },
// })


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     proxy: {
//       '/api': {
//         target: 'http://127.0.0.1:8000',
//         changeOrigin: true,
//       },
//     },
//   },
// })

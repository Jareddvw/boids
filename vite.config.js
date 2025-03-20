import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const config = {
    base: '/boids',
    server: {
      host: '0.0.0.0',
      port: 3001,
    }
  }

  return config
})
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Silsilah Bani Abd. Mutthalib',
    short_name: 'Silsilah Bani',
    description: 'Aplikasi Silsilah Keluarga Bani Abd. Mutthalib',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#d4a853',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}

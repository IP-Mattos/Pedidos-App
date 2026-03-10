import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  // Fetch UnifrakturCook (same Gothic font as the navbar logo)
  // Using an older UA so Google Fonts returns TTF (supported by Satori/next/og)
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap',
    {
      headers: {
        // Firefox 27: supports WOFF but NOT WOFF2 → Google Fonts returns WOFF
        // Satori (next/og) rejects WOFF2 but accepts WOFF
        'User-Agent':
          'Mozilla/5.0 (Windows NT 6.1; rv:27.0) Gecko/20100101 Firefox/27.0',
      },
    }
  ).then((r) => r.text())

  const fontUrl = css.match(/url\((.+?)\)/)?.[1]
  const font = await fetch(fontUrl!).then((r) => r.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #991b1b, #b91c1c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'UnifrakturCook',
            fontSize: 26,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1,
          }}
        >
          P
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'UnifrakturCook',
          data: font,
          weight: 700,
        },
      ],
    }
  )
}

export function LogoPatricia({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 900 320'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      role='img'
      aria-label='Autoservice Patricia'
      fill='none'
    >
      <g fill='currentColor'>
        {/* Autoservice */}
        <text
          x='430'
          y='96'
          fontFamily='Arial, Helvetica, sans-serif'
          fontSize='48'
          fontWeight='400'
          letterSpacing='-1'
        >
          Autoservice
        </text>

        {/* Patricia */}
        <text
          x='150'
          y='220'
          fontFamily='Old English Text MT, UnifrakturCook, UnifrakturMaguntia, Cloister Black, serif'
          fontSize='150'
          fontWeight='700'
          letterSpacing='-2'
        >
          Patricia
        </text>
      </g>
    </svg>
  )
}

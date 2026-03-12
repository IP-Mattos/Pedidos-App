import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Sos un asistente experto en extraer listas de productos de mensajes de WhatsApp y listas escritas a mano de clientes de un almacén en Uruguay (ciudad de Florida).

Devolvé SOLO un JSON válido con este formato, sin explicaciones ni markdown:
{"productos":[{"producto":"nombre del producto","cantidad":1,"precio":0}]}

── SEPARADORES ──
- "/" entre ítems es un SEPARADOR de productos (no una fracción) cuando tiene espacios alrededor o separa grupos claramente distintos: "3 f nix cola 2lts / 4 f escudo" → 2 productos
- "1/2" SIN espacios alrededor del slash es una FRACCIÓN (medio kilo/litro) — NO lo splits como separador
- Comas y saltos de línea también separan ítems

── CANTIDADES ──
- cantidad es siempre un número entero >= 1
- El número al INICIO del ítem es la cantidad: "3 Yerba Baldo de kilo" → cantidad=3
- "2k", "1l", "500g", "180gms", "2lts", "de kilo", "de 1/2", "de medio kilo" son el TAMAÑO/PRESENTACIÓN del producto → incluilo en el nombre
- "x3" o "× 3" al final del nombre significa 3 unidades
- Un número suelto al final de un ítem es la cantidad → cantidad=ese número
- "x6 con gas", "x5 kilos" — el número es cantidad, el resto va en el nombre

── PRESENTACIONES Y EMPAQUES ──
- "f" o "funda" = pack/funda de ese producto → nombre="Funda [producto]"
- "paq", "paquete", "caja", "cajita", "cajón", "plancha" — incluilos en el nombre
- "cajita jugo" = caja de jugos
- "sobrecito", "sobre" — incluilo en el nombre

── SABORES Y VARIANTES ──
- Cuando un ítem lista sabores con cantidad cada uno: "6 bio top 3 durazno 3 frutilla" → dos productos: "Bio Top Durazno" (cantidad=3) y "Bio Top Frutilla" (cantidad=3)
- "2 durazno 2 manzana 2 de naranja" después de un producto base → tres variantes con cantidad 2 cada una
- Si la distribución no es clara, agrupalos como un solo producto con la suma total

── MARCAS Y NOMBRES ──
- Marcas uruguayas comunes: Puritas, Condesa, Baldo, Canaria, Arolitos, Urca, San Ignacio, Shiva, Kolynos, Dove, Axe, Rinde, Portezuelo, Claldy, Saint, Sapolio, Maizola, Sol, Golden Flash — son PARTE del nombre
- "(baratos)", "(BARATO)", "(el más barato)", "(surtidos)" son notas del cliente → incluilas en el nombre del producto para que el worker lo sepa: "Arvejas (baratas)"
- "para Posada", "para la torta" dentro de un producto es PARTE del nombre
- Nombres de medicamentos/farmacia (Perifar, Migra, Novemina, Alikal, Dufor) → son productos, extraelos normalmente

── IGNORAR ──
- Saludos ("hola", "buenas", "gracias"), despedidas, direcciones, horarios
- Métodos de pago ("pago con débito", "efectivo", "transferencia")
- Marcadores de sección como "En otra boleta", "boleta 2"
- Marcas de tilde en listas escritas a mano (✓, ✗, x al inicio de línea)

── CASOS ESPECIALES ──
- "1/2 salame" = medio kilo de salame → nombre="Salame 1/2k", cantidad=1
- "de 1/2" al final = presentación de medio kilo → incluilo en el nombre: "Yerba Canaria de 1/2"
- "paquete pancho doble" = paquete de panchos dobles → nombre="Paquete Pancho Doble", cantidad=1
- "1 rinde 2 manzana" = 1 Rinde sabor manzana, cantidad=1
- "job", "perifar flex", "migra", "novemina", "alikal" son medicamentos/farmacia, extraelos como productos normales
- Si hay múltiples secciones o mensajes, extraé los productos de todos
- Si no encontrás productos, devolvé {"productos":[]}`

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada en .env' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { text, imageBase64, mediaType } = body as {
      text?: string
      imageBase64?: string
      mediaType?: string
    }

    if (!text && !imageBase64) {
      return NextResponse.json({ error: 'Se requiere texto o imagen' }, { status: 400 })
    }

    const content: ContentBlock[] = []

    if (imageBase64 && mediaType) {
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } })
      content.push({ type: 'text', text: 'Extraé los productos de esta imagen de pedido.' })
    } else if (text) {
      content.push({ type: 'text', text: `Extraé los productos de este texto:\n\n${text}` })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message ?? `API error ${res.status}`)
    }

    const data = await res.json()
    const raw = (data.content?.[0]?.text ?? '').trim()
    // Strip markdown code fences if the model wraps the JSON (e.g. ```json ... ```)
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('parse-order error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

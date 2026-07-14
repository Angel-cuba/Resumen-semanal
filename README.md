# Resumen

SPA en React + TypeScript para visualizar el resumen diario de correos laborales con foco junior-first.

## Lo que hace

- Carga un manifiesto de reportes diarios desde `public/data/manifest.json`.
- Muestra tarjetas por seccion: aplicables, revisar, descartadas, recruiters, entrevistas, urgentes, newsletters e irrelevantes.
- Permite filtrar por categoria, nivel, decision, prioridad, match score y texto.
- Abre un panel lateral con el detalle completo de cada oportunidad y sus enlaces funcionales.
- Genera URLs compartibles por fecha e item: `/?date=2026-07-14&item=real-hired-react-node-0714`.
- Mantiene una ventana visible maxima de 7 dias de reportes.

## Desarrollo local

```bash
npm install
npm run dev
```

Build de produccion:

```bash
npm run build
```

## Contrato de datos

`public/data/manifest.json`

```json
{
  "retentionDays": 7,
  "latestDate": "2026-07-14",
  "availableDates": ["2026-07-14"]
}
```

`public/data/daily/YYYY-MM-DD.json`

```json
{
  "date": "2026-07-14",
  "source": "CV real local + Gmail real",
  "visualUrl": "/?date=2026-07-14",
  "summary": "Resumen del dia...",
  "topActions": ["Accion 1", "Accion 2"],
  "stats": {
    "total": 8,
    "aplicar": 0,
    "revisar": 4,
    "descartar": 2,
    "alta": 4
  },
  "items": []
}
```

Cada `item` del arreglo `items` debe incluir:

- `id`, `section`, `title`, `company`, `location`, `workMode`
- `level`, `decision`, `priority`, `matchScore`
- `emailDate`, `sender`, `summary`, `rationale`, `nextAction`
- `link`, `stackMatch`, `missingSkills`
- `experienceRequired`, `compatibleExperience`
- `risks`, `advantages`, `whyApply`, `emailKind`

## Flujo diario esperado

1. El proceso diario analiza correos y genera `public/data/daily/YYYY-MM-DD.json`.
2. Ejecuta `npm run retain:data` para conservar solo las 7 fechas mas recientes y regenerar `public/data/manifest.json`.
3. El deploy estatico publica la SPA y la fecha queda visible desde el selector.

## Politica de retencion

- El dashboard conserva un maximo de 7 dias naturales visibles.
- Al entrar un nuevo dia, cualquier JSON fuera de esa ventana se borra del directorio `public/data/daily/`.
- El manifiesto se recalcula automaticamente para que `latestDate` y `availableDates` siempre reflejen solo la semana activa.
- En el flujo diario de Gmail, los correos laborales mas antiguos que la ventana retenida deben moverse a Trash.
- Tambien se pueden mover a Trash correos del dia clasificados como `descartada`, `irrelevante`, `newsletter` o confirmaciones de candidatura ya registradas, siempre que no haya seguimiento activo pendiente.

## Deploy

El proyecto esta preparado para deploy estatico en Vercel o Netlify sin backend adicional.

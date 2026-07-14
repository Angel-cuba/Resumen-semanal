import { useEffect, useMemo, useState } from 'react'
import './App.css'

type SectionKey =
  | 'aplicable'
  | 'revisar'
  | 'descartada'
  | 'recruiter'
  | 'entrevista'
  | 'urgente'
  | 'newsletter'
  | 'irrelevante'

type Level =
  | 'junior'
  | 'intern'
  | 'trainee'
  | 'graduate'
  | 'associate'
  | 'mid'
  | 'senior'
  | 'unknown'

type Decision = 'aplicar' | 'revisar' | 'guardar' | 'descartar'
type Priority = 'alta' | 'media' | 'baja'

type ReportItem = {
  id: string
  section: SectionKey
  title: string
  company: string
  location: string
  workMode: string
  level: Level
  decision: Decision
  priority: Priority
  matchScore: number
  emailDate: string
  sender: string
  summary: string
  rationale: string
  nextAction: string
  link?: string
  stackMatch: string[]
  missingSkills: string[]
  experienceRequired: string
  compatibleExperience: string
  risks: string[]
  advantages: string[]
  whyApply: string
  emailKind: string
}

type DailyReport = {
  date: string
  source: string
  visualUrl: string
  summary: string
  topActions: string[]
  stats: {
    total: number
    aplicar: number
    revisar: number
    descartar: number
    alta: number
  }
  items: ReportItem[]
}

type Manifest = {
  retentionDays?: number
  latestDate: string
  availableDates: string[]
}

type Filters = {
  section: 'all' | SectionKey
  level: 'all' | Level
  decision: 'all' | Decision
  priority: 'all' | Priority
  minMatch: number
  search: string
}

const sectionMeta: Array<{
  key: SectionKey
  label: string
  description: string
}> = [
  {
    key: 'aplicable',
    label: 'Ofertas aplicables',
    description: 'Vacantes con señales suficientemente claras para enviar candidatura.',
  },
  {
    key: 'revisar',
    label: 'Ofertas para revisar',
    description: 'Buenas candidatas, pero todavía requieren validar seniority, años o modalidad.',
  },
  {
    key: 'descartada',
    label: 'Ofertas descartadas',
    description: 'Fuera de alcance por seniority, stack o logística.',
  },
  {
    key: 'recruiter',
    label: 'Respuestas de recruiters',
    description: 'Mensajes directos que merecen seguimiento específico.',
  },
  {
    key: 'entrevista',
    label: 'Entrevistas o próximos pasos',
    description: 'Pipelines abiertos, cierres o movimientos del proceso.',
  },
  {
    key: 'urgente',
    label: 'Correos urgentes',
    description: 'Temas operativos que afectan cuentas o el foco del día.',
  },
  {
    key: 'newsletter',
    label: 'Newsletters técnicas útiles',
    description: 'Contenido útil, separado de las candidaturas aplicables.',
  },
  {
    key: 'irrelevante',
    label: 'Correos irrelevantes',
    description: 'Ruido que no debe competir con el bloque de postulación.',
  },
]

const levelLabel: Record<Level, string> = {
  junior: 'Junior',
  intern: 'Intern',
  trainee: 'Trainee',
  graduate: 'Graduate',
  associate: 'Associate',
  mid: 'Mid',
  senior: 'Senior',
  unknown: 'Unknown',
}

const decisionLabel: Record<Decision, string> = {
  aplicar: 'Aplicar',
  revisar: 'Revisar',
  guardar: 'Guardar',
  descartar: 'Descartar',
}

const priorityLabel: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

function readQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    date: params.get('date') ?? '',
    item: params.get('item') ?? '',
  }
}

function resolveVisualUrl(rawUrl: string) {
  if (!rawUrl) return window.location.href
  return new URL(rawUrl, window.location.origin).toString()
}

function App() {
  const initialQuery = readQueryParams()
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(initialQuery.date)
  const [report, setReport] = useState<DailyReport | null>(null)
  const [selectedId, setSelectedId] = useState<string>(initialQuery.item)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filters, setFilters] = useState<Filters>({
    section: 'all',
    level: 'all',
    decision: 'all',
    priority: 'all',
    minMatch: 0,
    search: '',
  })

  useEffect(() => {
    async function loadManifest() {
      try {
        setLoading(true)
        const response = await fetch('/data/manifest.json')
        if (!response.ok) {
          throw new Error('No se pudo cargar el manifiesto de reportes.')
        }
        const data = (await response.json()) as Manifest
        setManifest(data)
        setSelectedDate((currentDate) => {
          if (currentDate && data.availableDates.includes(currentDate)) return currentDate
          return data.latestDate
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error desconocido.')
      } finally {
        setLoading(false)
      }
    }

    void loadManifest()
  }, [])

  useEffect(() => {
    if (!selectedDate) return

    async function loadReport() {
      try {
        setLoading(true)
        const response = await fetch(`/data/daily/${selectedDate}.json`)
        if (!response.ok) {
          throw new Error(`No se pudo cargar el reporte del ${selectedDate}.`)
        }
        const data = (await response.json()) as DailyReport
        setReport(data)
        setSelectedId(data.items[0]?.id ?? '')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error desconocido.')
      } finally {
        setLoading(false)
      }
    }

    void loadReport()
  }, [selectedDate])

  const filteredItems = useMemo(() => {
    if (!report) return []

    return report.items.filter((item) => {
      if (filters.section !== 'all' && item.section !== filters.section) return false
      if (filters.level !== 'all' && item.level !== filters.level) return false
      if (filters.decision !== 'all' && item.decision !== filters.decision) return false
      if (filters.priority !== 'all' && item.priority !== filters.priority) return false
      if (item.matchScore < filters.minMatch) return false

      if (filters.search.trim()) {
        const haystack = [
          item.title,
          item.company,
          item.location,
          item.summary,
          item.rationale,
          item.stackMatch.join(' '),
        ]
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(filters.search.trim().toLowerCase())) return false
      }

      return true
    })
  }, [filters, report])

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null
  }, [filteredItems, selectedId])

  useEffect(() => {
    if (selectedItem && selectedItem.id !== selectedId) {
      setSelectedId(selectedItem.id)
    }
  }, [selectedId, selectedItem])

  useEffect(() => {
    if (!selectedDate) return

    const params = new URLSearchParams(window.location.search)
    params.set('date', selectedDate)

    if (selectedId) {
      params.set('item', selectedId)
    } else {
      params.delete('item')
    }

    const query = params.toString()
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState({}, '', nextUrl)
  }, [selectedDate, selectedId])

  if (loading && !report) {
    return <div className="screen-state">Cargando resumen...</div>
  }

  if (error && !report) {
    return <div className="screen-state screen-state-error">{error}</div>
  }

  if (!report || !manifest) {
    return <div className="screen-state">No hay datos para mostrar.</div>
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Resumen laboral diario</p>
          <h1>Resumen</h1>
          <p className="hero-summary">{report.summary}</p>
          <p className="retention-note">
            Historial visible: maximo {manifest.retentionDays ?? 7} dias. Los cortes mas antiguos se eliminan del dashboard.
          </p>
          <p className="visual-here">
            <strong>Visual here:</strong>{' '}
            <a href={resolveVisualUrl(report.visualUrl)} target="_blank" rel="noreferrer">
              {resolveVisualUrl(report.visualUrl)}
            </a>
          </p>
        </div>

        <div className="hero-side">
          <label className="date-picker">
            <span>Fecha</span>
            <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
              {manifest.availableDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </label>

          <div className="stats-grid">
            <article className="stat-card">
              <span>Total</span>
              <strong>{report.stats.total}</strong>
            </article>
            <article className="stat-card">
              <span>Aplicar</span>
              <strong>{report.stats.aplicar}</strong>
            </article>
            <article className="stat-card">
              <span>Revisar</span>
              <strong>{report.stats.revisar}</strong>
            </article>
            <article className="stat-card">
              <span>Alta prioridad</span>
              <strong>{report.stats.alta}</strong>
            </article>
          </div>
        </div>
      </header>

      <section className="top-actions">
        {report.topActions.map((action) => (
          <article key={action} className="action-card">
            <span>Acción recomendada</span>
            <p>{action}</p>
          </article>
        ))}
      </section>

      <section className="filters-panel">
        <div className="filters-head">
          <div>
            <p className="eyebrow">Filtros</p>
            <h2>Explorar el día</h2>
          </div>
        </div>

        <div className="filters-grid">
          <label>
            <span>Categoría</span>
            <select
              value={filters.section}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  section: event.target.value as Filters['section'],
                }))
              }
            >
              <option value="all">Todas</option>
              {sectionMeta.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Nivel</span>
            <select
              value={filters.level}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  level: event.target.value as Filters['level'],
                }))
              }
            >
              <option value="all">Todos</option>
              {Object.entries(levelLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Decisión</span>
            <select
              value={filters.decision}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  decision: event.target.value as Filters['decision'],
                }))
              }
            >
              <option value="all">Todas</option>
              {Object.entries(decisionLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Prioridad</span>
            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  priority: event.target.value as Filters['priority'],
                }))
              }
            >
              <option value="all">Todas</option>
              {Object.entries(priorityLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Match mínimo</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minMatch}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  minMatch: Number(event.target.value),
                }))
              }
            />
            <strong>{filters.minMatch}%</strong>
          </label>

          <label className="search-field">
            <span>Búsqueda</span>
            <input
              type="search"
              placeholder="React, Malta, recruiter, junior..."
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>

      <main className="layout">
        <section className="board">
          {sectionMeta.map((section) => {
            const items = filteredItems.filter((item) => item.section === section.key)
            if (!items.length) return null

            return (
              <article key={section.key} className="section-card">
                <div className="section-head">
                  <div>
                    <h3>{section.label}</h3>
                    <p>{section.description}</p>
                  </div>
                  <span className="section-count">{items.length}</span>
                </div>

                <div className="cards-list">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`job-card ${selectedItem?.id === item.id ? 'is-active' : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="job-card-head">
                        <h4>{item.title}</h4>
                        <span className={`match-pill match-${item.priority}`}>
                          {item.matchScore}%
                        </span>
                      </div>

                      <p className="job-card-company">
                        {item.company} · {item.location}
                      </p>

                      <div className="badge-row">
                        <span className={`badge badge-level level-${item.level}`}>
                          {levelLabel[item.level]}
                        </span>
                        <span className={`badge badge-decision decision-${item.decision}`}>
                          {decisionLabel[item.decision]}
                        </span>
                        <span className={`badge badge-priority priority-${item.priority}`}>
                          {priorityLabel[item.priority]}
                        </span>
                      </div>

                      <p className="job-card-summary">{item.summary}</p>
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
        </section>

        <aside className="detail-panel">
          {selectedItem ? (
            <>
              <p className="eyebrow">Detalle</p>
              <h2>{selectedItem.title}</h2>
              <p className="detail-company">
                {selectedItem.company} · {selectedItem.location} · {selectedItem.workMode}
              </p>

              <div className="badge-row">
                <span className={`badge badge-level level-${selectedItem.level}`}>
                  {levelLabel[selectedItem.level]}
                </span>
                <span className={`badge badge-decision decision-${selectedItem.decision}`}>
                  {decisionLabel[selectedItem.decision]}
                </span>
                <span className={`badge badge-priority priority-${selectedItem.priority}`}>
                  {priorityLabel[selectedItem.priority]}
                </span>
              </div>

              <div className="detail-block">
                <h3>Resumen</h3>
                <p>{selectedItem.summary}</p>
              </div>

              <div className="detail-block">
                <h3>Motivo de clasificación</h3>
                <p>{selectedItem.rationale}</p>
              </div>

              <div className="detail-grid">
                <div className="detail-mini-card">
                  <span>Experiencia requerida</span>
                  <strong>{selectedItem.experienceRequired}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Compatibilidad</span>
                  <strong>{selectedItem.compatibleExperience}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Correo</span>
                  <strong>{selectedItem.emailDate}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Remitente</span>
                  <strong>{selectedItem.sender}</strong>
                </div>
              </div>

              <div className="detail-block">
                <h3>Skills que coinciden</h3>
                <div className="chip-row">
                  {selectedItem.stackMatch.map((skill) => (
                    <span key={skill} className="chip chip-good">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="detail-block">
                <h3>Skills faltantes</h3>
                <div className="chip-row">
                  {selectedItem.missingSkills.map((skill) => (
                    <span key={skill} className="chip chip-muted">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="detail-block">
                <h3>Ventajas del perfil</h3>
                <ul>
                  {selectedItem.advantages.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-block">
                <h3>Riesgos</h3>
                <ul>
                  {selectedItem.risks.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-block">
                <h3>Siguiente acción</h3>
                <p>{selectedItem.nextAction}</p>
                <p className="detail-why">{selectedItem.whyApply}</p>
              </div>

              <div className="detail-actions">
                {selectedItem.link ? (
                  <a href={selectedItem.link} target="_blank" rel="noreferrer">
                    Abrir enlace original
                  </a>
                ) : (
                  <span className="link-disabled">Sin enlace original</span>
                )}
              </div>
            </>
          ) : (
            <div className="screen-state">Selecciona una tarjeta para ver el detalle.</div>
          )}
        </aside>
      </main>
    </div>
  )
}

export default App

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
type PlatformTab = 'all' | 'linkedin' | 'indeed' | 'other'
type SourcePlatform = 'linkedin' | 'indeed' | 'joppy' | 'hired' | 'gmail' | 'other'

type ExternalLink = {
  label: string
  url: string
}

type ConnectorFinding = {
  connector: 'gmail' | 'indeed' | 'linkedin'
  status: 'ok' | 'limited' | 'error'
  headline: string
  detail: string
}

type AutomationRule = {
  title: string
  detail: string
  status: 'activo' | 'conservador' | 'limitado'
}

type CombinationStep = {
  title: string
  detail: string
}

type LinkedInPeopleTarget = {
  name: string
  title?: string
  company?: string
  location?: string
  note: string
  profileUrl?: string
}

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
  sourcePlatform?: SourcePlatform
  sourceLabel?: string
  companyOverview?: string
  companyIndustry?: string
  companySize?: string
  companyStage?: string
  companyLocation?: string
  companyWebsite?: string
  companySignals?: string[]
  applicationStatus?: string
  applicationRoute?: string
  employmentType?: string
  salaryRange?: string
  relocationSupport?: string
  recruiterName?: string
  links?: ExternalLink[]
  linkedInPeopleTargets?: LinkedInPeopleTarget[]
}

type DailyReport = {
  date: string
  source: string
  visualUrl: string
  summary: string
  searchFocus?: string[]
  connectorFindings?: ConnectorFinding[]
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
  platform: 'all' | SourcePlatform
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
    description: 'Vacantes con permiso razonable de candidatura inmediata.',
  },
  {
    key: 'revisar',
    label: 'Ofertas para revisar',
    description: 'Buenas cartas, pero aun con huecos de seniority, anos o modalidad.',
  },
  {
    key: 'descartada',
    label: 'Ofertas descartadas',
    description: 'Fuera de alcance por seniority, stack o logistica.',
  },
  {
    key: 'recruiter',
    label: 'Respuestas de recruiters',
    description: 'Mensajes directos que merecen seguimiento especifico.',
  },
  {
    key: 'entrevista',
    label: 'Entrevistas o proximos pasos',
    description: 'Pipelines abiertos, cierres o movimientos del proceso.',
  },
  {
    key: 'urgente',
    label: 'Correos urgentes',
    description: 'Temas operativos que afectan cuentas o el foco del dia.',
  },
  {
    key: 'newsletter',
    label: 'Newsletters tecnicas utiles',
    description: 'Contenido util, separado del bloque de postulacion.',
  },
  {
    key: 'irrelevante',
    label: 'Correos irrelevantes',
    description: 'Ruido que no debe competir con las oportunidades reales.',
  },
]

const platformTabs: Array<{
  key: PlatformTab
  label: string
  description: string
}> = [
  {
    key: 'all',
    label: 'Todo',
    description: 'Vista completa del corte del dia.',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Alertas, guardados, candidaturas y replies que llegaron por LinkedIn.',
  },
  {
    key: 'indeed',
    label: 'Indeed',
    description: 'Separado para no perder oportunidades buenas del canal Indeed.',
  },
  {
    key: 'other',
    label: 'Otras fuentes',
    description: 'Joppy, Hired, recruiters directos y otros canales.',
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

const platformLabel: Record<SourcePlatform, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  joppy: 'Joppy',
  hired: 'Hired',
  gmail: 'Email directo',
  other: 'Otra fuente',
}

const automationLogic: {
  purpose: string
  channels: AutomationRule[]
  autoApplyRules: AutomationRule[]
  notifyRules: AutomationRule[]
  calendarRules: AutomationRule[]
  combinationSteps: CombinationStep[]
} = {
  purpose:
    'La SPA ahora deja visible como combinar Gmail, LinkedIn, Indeed y una capa tipo Agent Reach para encontrar mas oportunidades, aplicar solo cuando sea seguro y avisarte cuando haya continuidad real.',
  channels: [
    {
      title: 'Gmail como fuente base diaria',
      detail:
        'Seguimos tratando Gmail como el corte principal del dia: alertas, replies de recruiters, entrevistas, urgencias y newsletters salen de aqui primero.',
      status: 'activo',
    },
    {
      title: 'Indeed y LinkedIn como ramas de enriquecimiento',
      detail:
        'Cuando un conector trae resultados validos, la SPA los separa por origen para que no se mezclen con el corte base ni te inflen falsas opciones.',
      status: 'activo',
    },
    {
      title: 'Descubrimiento adicional tipo Agent Reach',
      detail:
        'La logica prevista es usar outreach y busqueda asistida para ampliar empresas y vacantes afines, pero manteniendo el mismo filtro junior-first y el mismo criterio conservador.',
      status: 'conservador',
    },
  ],
  autoApplyRules: [
    {
      title: 'Autoaplicar solo con permiso claro',
      detail:
        'Solo deberia dispararse candidatura automatica cuando el rol sea junior, intern, trainee, graduate o 0-3 anos, encaje con React/TypeScript/Node/Spring Boot y no tenga senales de seniority o relocation imposible.',
      status: 'conservador',
    },
    {
      title: 'Freno automatico ante duda',
      detail:
        'Si faltan datos clave de modalidad, pais, seniority o stack principal, la salida correcta sigue siendo `revisar`, no `aplicar`.',
      status: 'activo',
    },
    {
      title: 'Nada de autoaplicar a roles fuera de alcance',
      detail:
        'Senior, lead, staff, architect, manager, 5+ anos obligatorios o stacks dominados por cloud, DevOps, AI/ML o data engineering quedan bloqueados para candidatura automatica.',
      status: 'activo',
    },
  ],
  notifyRules: [
    {
      title: 'Avisar cuando aparezca continuidad real',
      detail:
        'Recruiters, respuestas, entrevistas, take-homes, follow-ups y cualquier cambio de estado deben destacarse por encima de nuevas alertas frias.',
      status: 'activo',
    },
    {
      title: 'Separar urgencias operativas del radar laboral',
      detail:
        'Mensajes de GitHub, cuentas o bloqueos tecnicos se muestran como urgentes, pero fuera del bloque de oportunidades aplicables.',
      status: 'activo',
    },
  ],
  calendarRules: [
    {
      title: 'Calendar solo para compromisos concretos',
      detail:
        'Entrevistas, calls, deadlines, recordatorios de follow-up y respuestas con fecha deben convertirse en siguiente accion visible y quedar listas para agenda.',
      status: 'conservador',
    },
    {
      title: 'No calendarizar ruido',
      detail:
        'Newsletters, descartes y alertas frias sin accion concreta no deben ocupar calendario.',
      status: 'activo',
    },
  ],
  combinationSteps: [
    {
      title: '1. Detectar',
      detail:
        'Unificar correos, alertas y hallazgos externos en un mismo corte diario con separacion clara por fuente.',
    },
    {
      title: '2. Filtrar',
      detail:
        'Aplicar el filtro CV-first y junior-first antes de considerar cualquier outreach o candidatura.',
    },
    {
      title: '3. Autoaplicar solo cuando sea seguro',
      detail:
        'Si el match es alto y no hay riesgos claros de seniority, stack o geografia, la automatizacion puede preparar la candidatura.',
    },
    {
      title: '4. Avisar y agendar continuidad',
      detail:
        'Toda respuesta, entrevista o tarea con fecha debe terminar en aviso visible y lista para calendarizar.',
    },
  ],
}

function readQueryParams() {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')

  return {
    date: params.get('date') ?? '',
    item: params.get('item') ?? '',
    tab: (tab === 'linkedin' || tab === 'indeed' || tab === 'other' ? tab : 'all') as PlatformTab,
  }
}

function resolveVisualUrl(rawUrl: string) {
  if (!rawUrl) return window.location.href
  return new URL(rawUrl, window.location.origin).toString()
}

function inferSourcePlatform(item: ReportItem): SourcePlatform {
  if (item.sourcePlatform) return item.sourcePlatform

  const sender = item.sender.toLowerCase()
  const title = item.title.toLowerCase()
  const company = item.company.toLowerCase()
  const link = item.link?.toLowerCase() ?? ''

  if (sender.includes('indeed') || title.includes('indeed') || company.includes('indeed')) {
    return 'indeed'
  }

  if (sender.includes('linkedin') || link.includes('linkedin')) {
    return 'linkedin'
  }

  if (sender.includes('joppy')) return 'joppy'
  if (company === 'hired' || sender.includes('hired')) return 'hired'
  if (sender.includes('@')) return 'gmail'

  return 'other'
}

function mapToTab(platform: SourcePlatform): PlatformTab {
  if (platform === 'linkedin') return 'linkedin'
  if (platform === 'indeed') return 'indeed'
  return 'other'
}

function getExternalLinks(item: ReportItem, platform: SourcePlatform) {
  const links = [...(item.links ?? [])]

  if (item.link && !links.some((entry) => entry.url === item.link)) {
    links.unshift({
      label:
        platform === 'linkedin' || platform === 'indeed' || platform === 'gmail'
          ? 'Abrir email origen'
          : 'Abrir enlace origen',
      url: item.link,
    })
  }

  if (item.companyWebsite && !links.some((entry) => entry.url === item.companyWebsite)) {
    links.push({
      label: 'Web de la empresa',
      url: item.companyWebsite,
    })
  }

  return links
}

function detailOrFallback(value?: string) {
  return value?.trim() ? value : 'No visible en el email.'
}

function renderLogicCards(title: string, entries: AutomationRule[]) {
  return (
    <article className="logic-card">
      <h3>{title}</h3>
      <div className="logic-list">
        {entries.map((entry) => (
          <div key={`${title}-${entry.title}`} className="logic-item">
            <div className="logic-item-head">
              <strong>{entry.title}</strong>
              <span className={`logic-status status-${entry.status}`}>{entry.status}</span>
            </div>
            <p>{entry.detail}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

function App() {
  const initialQuery = readQueryParams()
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(initialQuery.date)
  const [report, setReport] = useState<DailyReport | null>(null)
  const [selectedId, setSelectedId] = useState<string>(initialQuery.item)
  const [activeTab, setActiveTab] = useState<PlatformTab>(initialQuery.tab)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filters, setFilters] = useState<Filters>({
    section: 'all',
    level: 'all',
    decision: 'all',
    priority: 'all',
    platform: 'all',
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

  const decoratedItems = useMemo(() => {
    if (!report) return []

    return report.items.map((item) => {
      const sourcePlatform = inferSourcePlatform(item)

      return {
        ...item,
        sourcePlatform,
        sourceLabel: item.sourceLabel ?? platformLabel[sourcePlatform],
      }
    })
  }, [report])

  const filteredItems = useMemo(() => {
    return decoratedItems.filter((item) => {
      const sourcePlatform = item.sourcePlatform ?? 'other'
      const platformTab = mapToTab(sourcePlatform)

      if (activeTab !== 'all' && platformTab !== activeTab) return false
      if (filters.section !== 'all' && item.section !== filters.section) return false
      if (filters.level !== 'all' && item.level !== filters.level) return false
      if (filters.decision !== 'all' && item.decision !== filters.decision) return false
      if (filters.priority !== 'all' && item.priority !== filters.priority) return false
      if (filters.platform !== 'all' && sourcePlatform !== filters.platform) return false
      if (item.matchScore < filters.minMatch) return false

      if (filters.search.trim()) {
        const haystack = [
          item.title,
          item.company,
          item.location,
          item.summary,
          item.rationale,
          item.stackMatch.join(' '),
          item.companyOverview ?? '',
          item.companyIndustry ?? '',
          item.sourceLabel ?? '',
        ]
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(filters.search.trim().toLowerCase())) return false
      }

      return true
    })
  }, [activeTab, decoratedItems, filters])

  const platformCounts = useMemo(() => {
    const initialCounts: Record<PlatformTab, number> = {
      all: decoratedItems.length,
      linkedin: 0,
      indeed: 0,
      other: 0,
    }

    for (const item of decoratedItems) {
      const sourcePlatform = item.sourcePlatform ?? 'other'
      initialCounts[mapToTab(sourcePlatform)] += 1
    }

    return initialCounts
  }, [decoratedItems])

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
    params.set('tab', activeTab)

    if (selectedId) {
      params.set('item', selectedId)
    } else {
      params.delete('item')
    }

    const query = params.toString()
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState({}, '', nextUrl)
  }, [activeTab, selectedDate, selectedId])

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
          <h1>Radar de postulaciones</h1>
          <p className="hero-summary">{report.summary}</p>
          <p className="retention-note">
            Historial visible: maximo {manifest.retentionDays ?? 7} dias. Cada corte nuevo reemplaza lo que queda fuera de ventana.
          </p>
          <div className="hero-links">
            <a href={resolveVisualUrl(report.visualUrl)} target="_blank" rel="noreferrer">
              Visual here
            </a>
            <span>{resolveVisualUrl(report.visualUrl)}</span>
          </div>
          {report.searchFocus?.length ? (
            <div className="chip-row chip-row-hero">
              {report.searchFocus.map((focus) => (
                <span key={focus} className="chip chip-good">
                  {focus}
                </span>
              ))}
            </div>
          ) : null}
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

      <section className="source-tabs-panel">
        <div className="filters-head">
          <div>
            <p className="eyebrow">Canales</p>
            <h2>Separado por origen</h2>
          </div>
        </div>

        <div className="source-tabs">
          {platformTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`source-tab ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <strong>{platformCounts[tab.key]}</strong>
              <small>{tab.description}</small>
            </button>
          ))}
        </div>
      </section>

      {report.connectorFindings?.length ? (
        <section className="connector-panel">
          <div className="filters-head">
            <div>
              <p className="eyebrow">Conectores</p>
              <h2>Estado real de las fuentes</h2>
            </div>
          </div>

          <div className="connector-grid">
            {report.connectorFindings.map((entry) => (
              <article key={entry.connector} className={`connector-card status-${entry.status}`}>
                <span className="connector-label">{entry.connector}</span>
                <h3>{entry.headline}</h3>
                <p>{entry.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="top-actions">
        {report.topActions.map((action) => (
          <article key={action} className="action-card">
            <span>Accion recomendada</span>
            <p>{action}</p>
          </article>
        ))}
      </section>

      <section className="automation-panel">
        <div className="filters-head">
          <div>
            <p className="eyebrow">Automatizacion visible</p>
            <h2>Como se combina el radar y que se automatiza</h2>
          </div>
        </div>

        <p className="automation-summary">{automationLogic.purpose}</p>

        <div className="combination-strip">
          {automationLogic.combinationSteps.map((step) => (
            <article key={step.title} className="step-card">
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>

        <div className="automation-grid">
          {renderLogicCards('Fuentes y descubrimiento', automationLogic.channels)}
          {renderLogicCards('Reglas de autoaplicacion', automationLogic.autoApplyRules)}
          {renderLogicCards('Avisos y seguimiento', automationLogic.notifyRules)}
          {renderLogicCards('Criterio de calendarizacion', automationLogic.calendarRules)}
        </div>
      </section>

      <section className="filters-panel">
        <div className="filters-head">
          <div>
            <p className="eyebrow">Filtros</p>
            <h2>Explorar el dia</h2>
          </div>
        </div>

        <div className="filters-grid">
          <label>
            <span>Categoria</span>
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
            <span>Decision</span>
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
            <span>Plataforma exacta</span>
            <select
              value={filters.platform}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  platform: event.target.value as Filters['platform'],
                }))
              }
            >
              <option value="all">Todas</option>
              {Object.entries(platformLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Match minimo</span>
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
            <span>Busqueda</span>
            <input
              type="search"
              placeholder="React, Malta, Indeed, recruiter, junior..."
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
          {filteredItems.length === 0 ? (
            <article className="empty-card">
              <p className="eyebrow">Sin resultados</p>
              <h3>
                {activeTab === 'indeed'
                  ? 'Hoy no entraron oportunidades Indeed en este corte.'
                  : 'No hay items que cumplan los filtros actuales.'}
              </h3>
              <p>
                {activeTab === 'indeed'
                  ? 'La separacion queda lista para que el flujo diario empuje Indeed cuando aparezcan alertas o candidaturas viables.'
                  : 'Afloja filtros o cambia de pestana para recuperar mas oportunidades.'}
              </p>
            </article>
          ) : null}

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
                        <span className={`match-pill match-${item.priority}`}>{item.matchScore}%</span>
                      </div>

                      <p className="job-card-company">
                        {item.company} · {item.location}
                      </p>

                      <div className="badge-row">
                        <span className={`badge badge-platform platform-${item.sourcePlatform}`}>
                          {item.sourceLabel}
                        </span>
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

                      <div className="card-subline">
                        <span>{detailOrFallback(item.applicationStatus)}</span>
                        <span>{detailOrFallback(item.employmentType)}</span>
                      </div>
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
              <div className="detail-topbar">
                <p className="eyebrow">Detalle</p>
                <span className={`match-pill match-${selectedItem.priority}`}>{selectedItem.matchScore}%</span>
              </div>

              <h2>{selectedItem.title}</h2>
              <p className="detail-company">
                {selectedItem.company} · {selectedItem.location} · {selectedItem.workMode}
              </p>

              <div className="badge-row">
                <span className={`badge badge-platform platform-${selectedItem.sourcePlatform}`}>
                  {selectedItem.sourceLabel}
                </span>
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

              <div className="detail-grid detail-grid-hero">
                <div className="detail-mini-card">
                  <span>Estado sugerido</span>
                  <strong>{decisionLabel[selectedItem.decision]}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Ruta de aplicacion</span>
                  <strong>{detailOrFallback(selectedItem.applicationRoute)}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Estado del proceso</span>
                  <strong>{detailOrFallback(selectedItem.applicationStatus)}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Tipo de empleo</span>
                  <strong>{detailOrFallback(selectedItem.employmentType)}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Experiencia requerida</span>
                  <strong>{selectedItem.experienceRequired}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Compatibilidad con tu CV</span>
                  <strong>{selectedItem.compatibleExperience}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Compensacion</span>
                  <strong>{detailOrFallback(selectedItem.salaryRange)}</strong>
                </div>
                <div className="detail-mini-card">
                  <span>Relocation</span>
                  <strong>{detailOrFallback(selectedItem.relocationSupport)}</strong>
                </div>
              </div>

              <div className="detail-block">
                <h3>Mini resumen del correo</h3>
                <p>{selectedItem.summary}</p>
              </div>

              <div className="detail-block">
                <h3>Motivo de clasificacion</h3>
                <p>{selectedItem.rationale}</p>
              </div>

              <div className="detail-block">
                <h3>Empresa</h3>
                <div className="detail-grid">
                  <div className="detail-mini-card">
                    <span>Industria</span>
                    <strong>{detailOrFallback(selectedItem.companyIndustry)}</strong>
                  </div>
                  <div className="detail-mini-card">
                    <span>Tamano</span>
                    <strong>{detailOrFallback(selectedItem.companySize)}</strong>
                  </div>
                  <div className="detail-mini-card">
                    <span>Etapa</span>
                    <strong>{detailOrFallback(selectedItem.companyStage)}</strong>
                  </div>
                  <div className="detail-mini-card">
                    <span>Base</span>
                    <strong>{detailOrFallback(selectedItem.companyLocation)}</strong>
                  </div>
                </div>
                <p>{detailOrFallback(selectedItem.companyOverview)}</p>
                {selectedItem.companySignals?.length ? (
                  <div className="chip-row">
                    {selectedItem.companySignals.map((signal) => (
                      <span key={signal} className="chip chip-muted">
                        {signal}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="detail-block">
                <h3>Aplicacion y contacto</h3>
                <div className="detail-grid">
                  <div className="detail-mini-card">
                    <span>Fecha del email</span>
                    <strong>{selectedItem.emailDate}</strong>
                  </div>
                  <div className="detail-mini-card">
                    <span>Remitente</span>
                    <strong>{selectedItem.sender}</strong>
                  </div>
                  <div className="detail-mini-card">
                    <span>Recruiter</span>
                    <strong>{detailOrFallback(selectedItem.recruiterName)}</strong>
                  </div>
                  <div className="detail-mini-card">
                    <span>Tipo de correo</span>
                    <strong>{selectedItem.emailKind}</strong>
                  </div>
                </div>
              </div>

              {selectedItem.linkedInPeopleTargets?.length ? (
                <div className="detail-block">
                  <h3>Targets de LinkedIn</h3>
                  <div className="people-grid">
                    {selectedItem.linkedInPeopleTargets.map((person) => (
                      <article key={`${selectedItem.id}-${person.name}`} className="person-card">
                        <strong>{person.name}</strong>
                        <span>{detailOrFallback(person.title)}</span>
                        <span>{detailOrFallback(person.company)}</span>
                        <span>{detailOrFallback(person.location)}</span>
                        <p>{person.note}</p>
                        {person.profileUrl ? (
                          <a href={person.profileUrl} target="_blank" rel="noreferrer">
                            Abrir perfil
                          </a>
                        ) : (
                          <span className="link-disabled person-link-disabled">Perfil no disponible</span>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

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
                <h3>Siguiente accion recomendada</h3>
                <p>{selectedItem.nextAction}</p>
                <p className="detail-why">{selectedItem.whyApply}</p>
              </div>

              <div className="detail-actions">
                {getExternalLinks(selectedItem, selectedItem.sourcePlatform ?? 'other').length ? (
                  getExternalLinks(selectedItem, selectedItem.sourcePlatform ?? 'other').map((entry) => (
                    <a key={`${selectedItem.id}-${entry.url}`} href={entry.url} target="_blank" rel="noreferrer">
                      {entry.label}
                    </a>
                  ))
                ) : (
                  <span className="link-disabled">No hay enlaces visibles en este correo</span>
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

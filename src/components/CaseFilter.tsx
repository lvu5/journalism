'use client'

import { useState } from 'react'

import { IncidentCard } from './IncidentCard'
import {
  caseStatusDescriptions,
  caseStatusLabels,
  type IncidentView,
} from '@/lib/content'
import type { Locale } from '@/lib/i18n'

type FilterValue = IncidentView['caseStatus'] | 'all'

export function CaseFilter({ incidents, locale }: { incidents: IncidentView[]; locale: Locale }) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const lifecycle = Object.keys(caseStatusLabels[locale]) as IncidentView['caseStatus'][]
  const visibleIncidents = activeFilter === 'all'
    ? incidents
    : incidents.filter((incident) => incident.caseStatus === activeFilter)
  const copy = locale === 'vi'
    ? {
        lifecycle: 'Vòng đời hồ sơ',
        publicStates: '5 trạng thái công khai',
        cases: 'hồ sơ',
        all: 'Tất cả',
        clear: 'Bỏ lọc',
        filterBy: 'Lọc theo',
        empty: 'Không có hồ sơ ở trạng thái này.',
      }
    : {
        lifecycle: 'Case lifecycle',
        publicStates: '5 public states',
        cases: 'cases',
        all: 'All cases',
        clear: 'Clear filter',
        filterBy: 'Filter by',
        empty: 'There are no cases with this status.',
      }

  return (
    <>
      <section className="case-lifecycle" aria-labelledby="case-lifecycle-heading">
        <div className="section-heading">
          <div>
            <h2 id="case-lifecycle-heading">{copy.lifecycle}</h2>
            <span>{copy.publicStates}</span>
          </div>
          <div className="case-filter-controls">
            <span aria-live="polite">{visibleIncidents.length} {copy.cases}</span>
            <button
              aria-pressed={activeFilter === 'all'}
              className="case-filter-reset"
              onClick={() => setActiveFilter('all')}
              type="button"
            >
              {activeFilter === 'all' ? copy.all : copy.clear}
            </button>
          </div>
        </div>
        <div className="case-lifecycle-grid">
          {lifecycle.map((caseStatus, index) => {
            const count = incidents.filter((incident) => incident.caseStatus === caseStatus).length
            const isActive = activeFilter === caseStatus

            return (
              <button
                aria-label={`${copy.filterBy} ${caseStatusLabels[locale][caseStatus]}`}
                aria-pressed={isActive}
                className={`case-filter-option${isActive ? ' is-active' : ''}`}
                key={caseStatus}
                onClick={() => setActiveFilter(caseStatus)}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{caseStatusLabels[locale][caseStatus]}</h3>
                  <p>{caseStatusDescriptions[locale][caseStatus]}</p>
                  <strong>{count} {copy.cases}</strong>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="incident-list">
        {visibleIncidents.length ? (
          visibleIncidents.map((incident) => (
            <IncidentCard incident={incident} key={incident.id} locale={locale} />
          ))
        ) : (
          <p className="case-filter-empty">{copy.empty}</p>
        )}
      </div>
    </>
  )
}

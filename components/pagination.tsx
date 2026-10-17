'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null

  return (
    <div className="pagination" aria-label="Пагінація">
      <span>Сторінка {page} з {pageCount}</span>
      <div className="pagination-actions">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Попередня сторінка">
          <ChevronLeft size={16} />
        </button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Наступна сторінка">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

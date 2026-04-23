import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStorage, setStorage } from '../utils/storage'
import { useDateNavigation } from '../hooks/useDateNavigation'
import CompactCalendar from '../components/CompactCalendar'
import {
  LEDGER_STORAGE_KEY,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  summarizeMonth,
  occurrencesOnDate,
  categoryLabel,
} from '../utils/ledgerUtils'
import './LedgerPage.css'

const defaultForm = (dateKey) => ({
  type: 'expense',
  amount: '',
  memo: '',
  categoryId: EXPENSE_CATEGORIES[0].id,
  scheduleType: 'once',
  date: dateKey,
  startDate: dateKey,
  installmentMonths: 3,
  recurrenceStart: dateKey,
  recurrenceEnd: dateKey,
  recurrenceInterval: 'month',
})

export default function LedgerPage() {
  const { currentDate, setCurrentDate, dateKey } = useDateNavigation()
  const [entries, setEntries] = useState([])
  const [viewMonth, setViewMonth] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(() => defaultForm(dateKey))

  useEffect(() => {
    setEntries(getStorage(LEDGER_STORAGE_KEY, []))
  }, [])

  const persist = (next) => {
    setStorage(LEDGER_STORAGE_KEY, next)
    setEntries(next)
  }

  const onViewMonthChange = useCallback((d) => {
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [])

  const { incomeTotal, expenseTotal, dayTint } = useMemo(
    () => summarizeMonth(entries, viewMonth.getFullYear(), viewMonth.getMonth()),
    [entries, viewMonth],
  )

  const dayList = useMemo(() => occurrencesOnDate(entries, dateKey), [entries, dateKey])

  const openNew = () => {
    setForm(defaultForm(dateKey))
    setModalOpen(true)
  }

  const submit = () => {
    const amount = Number(String(form.amount).replace(/,/g, ''))
    if (!amount || amount <= 0) return
    const scheduleType = form.scheduleType
    const base = {
      id: Date.now(),
      type: form.type,
      amount,
      memo: String(form.memo || '').trim(),
      categoryId: form.categoryId,
      scheduleType,
    }
    if (scheduleType === 'once') {
      if (!form.date) return
      persist([...entries, { ...base, date: form.date }])
    } else if (scheduleType === 'installment') {
      if (!form.startDate) return
      const m = Math.max(1, Math.min(120, Number(form.installmentMonths) || 1))
      persist([...entries, { ...base, startDate: form.startDate, installmentMonths: m }])
    } else if (scheduleType === 'recurring') {
      if (!form.recurrenceStart || !form.recurrenceEnd) return
      if (form.recurrenceEnd < form.recurrenceStart) return
      persist([
        ...entries,
        {
          ...base,
          recurrenceStart: form.recurrenceStart,
          recurrenceEnd: form.recurrenceEnd,
          recurrenceInterval: form.recurrenceInterval,
        },
      ])
    }
    setModalOpen(false)
  }

  const removeEntry = (id) => {
    persist(entries.filter((e) => e.id !== id))
  }

  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div>
      <div className="page-route-body">
        <div className="page-title-row">
          <h1>가계부</h1>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            추가
          </button>
        </div>

        <div className="ledger-totals">
          <div className="ledger-totals__box ledger-totals__box--in">
            <div className="ledger-totals__label">총 입금</div>
            <div className="ledger-totals__value ledger-totals__value--in">
              {Math.round(incomeTotal).toLocaleString()}원
            </div>
          </div>
          <div className="ledger-totals__box ledger-totals__box--out">
            <div className="ledger-totals__label">총 출금</div>
            <div className="ledger-totals__value ledger-totals__value--out">
              {Math.round(expenseTotal).toLocaleString()}원
            </div>
          </div>
        </div>

        <CompactCalendar
          currentDate={currentDate}
          selectedDate={currentDate}
          onDateChange={(d) => setCurrentDate(d)}
          onViewMonthChange={onViewMonthChange}
          dayTint={dayTint}
        />

        <h2 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '0.35rem' }}>
          {dateKey} 내역
        </h2>
        <div className="page-route-body__grow">
          {dayList.length === 0 ? (
            <div className="empty-state" />
          ) : (
            dayList.map((o, idx) => (
              <div
                key={`${o.id}-${o.dateKey}-${idx}`}
                className={`ledger-line ${o.type === 'income' ? 'ledger-line--in' : 'ledger-line--out'}`}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{o.memo || '(메모 없음)'}</div>
                  <div className="ledger-line__meta">
                    {categoryLabel(o.type, o.categoryId)} · 항목 #{o.id}
                  </div>
                </div>
                <div
                  className={`ledger-line__amt ${o.type === 'income' ? 'ledger-line__amt--in' : 'ledger-line__amt--out'}`}
                >
                  {o.type === 'income' ? '+' : '−'}
                  {Math.round(o.amount).toLocaleString()}
                </div>
              </div>
            ))
          )}
          {dayList.length > 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              할부·반복은 같은 규칙으로 묶여 있습니다. 삭제는 아래에서 전체 항목을 지웁니다.
            </p>
          )}

          {dayList.length > 0 && (
            <>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: '0.35rem' }}>
                이 날짜에 포함된 항목 삭제
              </h3>
              {Array.from(new Set(dayList.map((o) => o.id))).map((id) => {
                const e = entries.find((x) => x.id === id)
                if (!e) return null
                return (
                  <div key={id} className="item-row" style={{ marginBottom: '0.35rem' }}>
                    <span style={{ flex: 1, fontSize: '0.88rem' }}>
                      {e.type === 'income' ? '입금' : '출금'} · {e.memo || '메모 없음'} ·{' '}
                      {e.scheduleType === 'installment'
                        ? `할부 ${e.installmentMonths}개월`
                        : e.scheduleType === 'recurring'
                          ? `반복(${e.recurrenceInterval})`
                          : '일시'}
                    </span>
                    <button type="button" className="btn btn-danger" onClick={() => removeEntry(id)}>
                      삭제
                    </button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(ev) => ev.target === ev.currentTarget && setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 style={{ marginBottom: '0.75rem' }}>거래 추가</h2>

            <div className="ledger-type-toggle">
              <button
                type="button"
                className={form.type === 'income' ? 'active--in' : ''}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    type: 'income',
                    categoryId: INCOME_CATEGORIES.some((c) => c.id === f.categoryId) ? f.categoryId : INCOME_CATEGORIES[0].id,
                  }))
                }
              >
                입금
              </button>
              <button
                type="button"
                className={form.type === 'expense' ? 'active--out' : ''}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    type: 'expense',
                    categoryId: EXPENSE_CATEGORIES.some((c) => c.id === f.categoryId) ? f.categoryId : EXPENSE_CATEGORIES[0].id,
                  }))
                }
              >
                출금
              </button>
            </div>

            <div className="form-group">
              <label>금액 (원)</label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>메모</label>
              <input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
            </div>

            <div className="form-group">
              <label>카테고리</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={{ width: '100%', padding: '0.55rem' }}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>결제 방식</label>
              <div className="ledger-schedule-row">
                {[
                  { v: 'once', l: '일시불' },
                  { v: 'installment', l: '할부' },
                  { v: 'recurring', l: '반복' },
                ].map((x) => (
                  <button
                    key={x.v}
                    type="button"
                    className={form.scheduleType === x.v ? 'active' : ''}
                    onClick={() => setForm({ ...form, scheduleType: x.v })}
                  >
                    {x.l}
                  </button>
                ))}
              </div>
            </div>

            {form.scheduleType === 'once' && (
              <div className="form-group">
                <label>날짜</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            )}

            {form.scheduleType === 'installment' && (
              <>
                <div className="form-group">
                  <label>첫 납부일 (달력에 매월 같은 규칙으로 표시)</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>할부 개월 수</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={form.installmentMonths}
                    onChange={(e) => setForm({ ...form, installmentMonths: e.target.value })}
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.35rem' }}>
                  입력한 금액은 총액으로 보고, 개월 수로 나눈 금액이 달력 각 날에 표시됩니다.
                </p>
              </>
            )}

            {form.scheduleType === 'recurring' && (
              <>
                <div className="form-group">
                  <label>반복 시작일</label>
                  <input
                    type="date"
                    value={form.recurrenceStart}
                    onChange={(e) => setForm({ ...form, recurrenceStart: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>반복 종료일</label>
                  <input type="date" value={form.recurrenceEnd} onChange={(e) => setForm({ ...form, recurrenceEnd: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>반복 주기</label>
                  <select
                    value={form.recurrenceInterval}
                    onChange={(e) => setForm({ ...form, recurrenceInterval: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem' }}
                  >
                    <option value="day">매일</option>
                    <option value="week">매주</option>
                    <option value="month">매월 (같은 일)</option>
                  </select>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.35rem' }}>
                  시작~종료 사이에만 달력에 표시됩니다. 금액은 매 회차마다 동일합니다.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={submit}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

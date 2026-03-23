import { useEffect, useMemo, useState } from 'react';
import * as recordApi from '../api/recordApi';

const TRACKERS = [
  { label: '캘린더', value: 'CALENDAR' },
  { label: '일기', value: 'JOURNAL' },
  { label: '가계부', value: 'BUDGET' },
  { label: '식단', value: 'DIET' },
  { label: '운동', value: 'WORKOUT' },
  { label: '러닝', value: 'RUNNING' },
];

function getTrackerLabel(value) {
  return TRACKERS.find((item) => item.value === value)?.label || value;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthTitle(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function buildCalendarCells(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }).map((_, idx) => {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + idx);
    return cellDate;
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LifeRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTracker, setActiveTracker] = useState(TRACKERS[0].value);
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [calories, setCalories] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await recordApi.getRecords(activeTracker, 0, 200);
      if (res.success && res.data) {
        setRecords(res.data.content || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || '기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTracker]);

  const trackerItems = useMemo(() => records, [records]);

  const calendarCells = useMemo(() => buildCalendarCells(monthCursor), [monthCursor]);

  const countByDate = useMemo(() => {
    const map = new Map();
    trackerItems.forEach((record) => {
      map.set(record.recordDate, (map.get(record.recordDate) || 0) + 1);
    });
    return map;
  }, [trackerItems]);

  const selectedDayItems = useMemo(
    () => trackerItems.filter((item) => item.recordDate === selectedDate),
    [trackerItems, selectedDate]
  );

  const selectedDaySummary = useMemo(() => {
    return selectedDayItems.reduce(
      (acc, item) => ({
        count: acc.count + 1,
        amount: acc.amount + (item.amount || 0),
        distanceKm: acc.distanceKm + (item.distanceKm || 0),
        durationMinutes: acc.durationMinutes + (item.durationMinutes || 0),
        calories: acc.calories + (item.calories || 0),
      }),
      { count: 0, amount: 0, distanceKm: 0, durationMinutes: 0, calories: 0 }
    );
  }, [selectedDayItems]);

  const clearTrackerSpecificFields = () => {
    setAmount('');
    setDistanceKm('');
    setDurationMinutes('');
    setCalories('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!details.trim()) {
      setError('상세 기록을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: activeTracker,
        recordDate,
        note: note.trim() || null,
        details: details.trim(),
      };
      if (activeTracker === 'BUDGET' && amount !== '') payload.amount = Number(amount);
      if (activeTracker === 'RUNNING' && distanceKm !== '') payload.distanceKm = Number(distanceKm);
      if ((activeTracker === 'RUNNING' || activeTracker === 'WORKOUT') && durationMinutes !== '') {
        payload.durationMinutes = Number(durationMinutes);
      }
      if ((activeTracker === 'RUNNING' || activeTracker === 'WORKOUT' || activeTracker === 'DIET') && calories !== '') {
        payload.calories = Number(calories);
      }

      const res = editingId
        ? await recordApi.updateRecord(editingId, payload)
        : await recordApi.createRecord(payload);
      if (!(res.success && res.data)) {
        setError(res.message || (editingId ? '기록 수정에 실패했습니다.' : '기록 저장에 실패했습니다.'));
        return;
      }
      setEditingId(null);
      setNote('');
      setDetails('');
      clearTrackerSpecificFields();
      setRecordDate(toIsoDate(new Date()));
      await fetchRecords();
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? '기록 수정에 실패했습니다.' : '기록 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (record) => {
    setEditingId(record.id);
    setRecordDate(record.recordDate);
    setSelectedDate(record.recordDate);
    setNote(record.note || '');
    setDetails(record.details || '');
    setAmount(record.amount ?? '');
    setDistanceKm(record.distanceKm ?? '');
    setDurationMinutes(record.durationMinutes ?? '');
    setCalories(record.calories ?? '');
    const targetMonth = new Date(record.recordDate);
    setMonthCursor(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('이 기록을 삭제할까요?');
    if (!ok) return;
    try {
      await recordApi.deleteRecord(id);
      await fetchRecords();
    } catch (err) {
      setError(err.response?.data?.message || '기록 삭제에 실패했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNote('');
    setDetails('');
    clearTrackerSpecificFields();
    setError('');
  };

  return (
    <div className="page-header">
      <h1>라이프 기록 허브</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1rem' }}>
        캘린더, 일기, 가계부, 식단, 운동, 러닝을 한 곳에서 빠르게 기록합니다.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {TRACKERS.map((tracker) => (
          <button
            key={tracker.value}
            type="button"
            className={activeTracker === tracker.value ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => {
              setActiveTracker(tracker.value);
              clearTrackerSpecificFields();
              setEditingId(null);
              setError('');
            }}
          >
            {tracker.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          >
            이전달
          </button>
          <div style={{ alignSelf: 'center', fontWeight: 600 }}>{getMonthTitle(monthCursor)}</div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          >
            다음달
          </button>
        </div>
        <div className="calendar-grid">
          {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
            <div key={w} className="calendar-weekday">{w}</div>
          ))}
          {calendarCells.map((date) => {
            const iso = toIsoDate(date);
            const inMonth = date.getMonth() === monthCursor.getMonth();
            const selected = iso === selectedDate;
            const count = countByDate.get(iso) || 0;
            return (
              <button
                key={iso}
                type="button"
                className={`calendar-cell${selected ? ' selected' : ''}${!inMonth ? ' dim' : ''}`}
                onClick={() => {
                  setSelectedDate(iso);
                  setRecordDate(iso);
                }}
              >
                <span>{date.getDate()}</span>
                {count > 0 && <small>{count}건</small>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ fontSize: '1rem' }}>
          {selectedDate} 집계
        </div>
        <div className="card-meta">
          기록 {selectedDaySummary.count}건 · 금액 {selectedDaySummary.amount.toFixed(2)} · 거리 {selectedDaySummary.distanceKm.toFixed(2)}km · 시간 {selectedDaySummary.durationMinutes}분 · 칼로리 {selectedDaySummary.calories}
        </div>
      </div>

      <form className="card" onSubmit={handleCreate}>
        <div className="form-group">
          <label htmlFor="recordDate">날짜</label>
          <input
            id="recordDate"
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="note">한 줄 메모 (선택)</label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder={`${getTrackerLabel(activeTracker)} 핵심 메모`}
          />
        </div>
        {activeTracker === 'BUDGET' && (
          <div className="form-group">
            <label htmlFor="amount">지출/수입 금액</label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예: 12000"
            />
          </div>
        )}
        {(activeTracker === 'RUNNING' || activeTracker === 'WORKOUT') && (
          <div className="form-group">
            <label htmlFor="durationMinutes">운동 시간(분)</label>
            <input
              id="durationMinutes"
              type="number"
              min="0"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="예: 45"
            />
          </div>
        )}
        {activeTracker === 'RUNNING' && (
          <div className="form-group">
            <label htmlFor="distanceKm">러닝 거리(km)</label>
            <input
              id="distanceKm"
              type="number"
              min="0"
              step="0.01"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="예: 5.3"
            />
          </div>
        )}
        {(activeTracker === 'RUNNING' || activeTracker === 'WORKOUT' || activeTracker === 'DIET') && (
          <div className="form-group">
            <label htmlFor="calories">칼로리</label>
            <input
              id="calories"
              type="number"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="예: 420"
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="details">상세 기록</label>
          <textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={`${getTrackerLabel(activeTracker)} 상세 내용을 자유롭게 입력하세요.`}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : editingId ? '기록 수정 저장' : `${getTrackerLabel(activeTracker)} 기록 저장`}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
              수정 취소
            </button>
          )}
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>기록을 불러오는 중...</p>
        ) : trackerItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>아직 {getTrackerLabel(activeTracker)} 기록이 없습니다.</p>
        ) : (
          trackerItems.map((record) => (
            <div className="card" key={record.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="card-title" style={{ wordBreak: 'break-word' }}>
                    {record.note || `${getTrackerLabel(record.type)} 기록`}
                  </div>
                  <div className="card-meta">
                    {getTrackerLabel(record.type)} · {record.recordDate} · {record.authorName} · {formatDateTime(record.createdAt)}
                  </div>
                  <div className="card-meta">
                    {record.amount != null ? `금액 ${record.amount}` : null}
                    {record.distanceKm != null ? ` 거리 ${record.distanceKm}km` : null}
                    {record.durationMinutes != null ? ` 시간 ${record.durationMinutes}분` : null}
                    {record.calories != null ? ` 칼로리 ${record.calories}` : null}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => handleStartEdit(record)}>
                    수정
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(record.id)}>
                    삭제
                  </button>
                </div>
              </div>
              <div className="card-content">{record.details}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

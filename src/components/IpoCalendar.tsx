import React, { useState, useMemo } from 'react';
import { IpoData } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const TURKISH_MONTHS = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
const TURKISH_MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function parseIpoDates(dateRange: string, currentYear: number) {
  if (!dateRange) return [];
  const lowerDate = dateRange.toLowerCase();
  
  let monthIdx = -1;
  for (let i = 0; i < TURKISH_MONTHS.length; i++) {
    if (lowerDate.includes(TURKISH_MONTHS[i])) {
      monthIdx = i;
      break;
    }
  }
  
  if (monthIdx === -1) return [];

  const numberMatches = lowerDate.match(/\b(\d{1,2})\b/g);
  if (!numberMatches) return [];

  return numberMatches.map(numStr => {
    return new Date(currentYear, monthIdx, parseInt(numStr));
  });
}

interface IpoCalendarProps {
  ipos: IpoData[];
  onIpoClick: (ipo: IpoData) => void;
}

export const IpoCalendar: React.FC<IpoCalendarProps> = ({ ipos, onIpoClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const today = () => setCurrentDate(new Date());

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // getDay() is 0 for Sun, 1 for Mon. We want Mon=0, Sun=6.
    const startDayIndex = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    const totalDays = lastDayOfMonth.getDate();
    
    const days = [];
    // Padding from previous month
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }
    // Days in current month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }
    
    // Add padding to complete the last week grid if necessary
    const totalCells = Math.ceil(days.length / 7) * 7;
    while (days.length < totalCells) {
      days.push(null);
    }

    return days;
  }, [currentYear, currentMonth]);

  const parsedEvents = useMemo(() => {
    const events: { date: Date, type: 'talep' | 'islem', ipo: IpoData }[] = [];
    
    // Current year covers the active calendar view year
    ipos.forEach(ipo => {
      if (ipo.dateRange) {
        const talepDates = parseIpoDates(ipo.dateRange, currentYear);
        talepDates.forEach(d => {
          events.push({ date: d, type: 'talep', ipo });
        });
      }
      if (ipo.tradingDate) {
        const islemDates = parseIpoDates(ipo.tradingDate, currentYear);
        islemDates.forEach(d => {
          events.push({ date: d, type: 'islem', ipo });
        });
      }
    });
    
    return events;
  }, [ipos, currentYear]);

  const realToday = new Date();
  const isCurrentMonth = realToday.getFullYear() === currentYear && realToday.getMonth() === currentMonth;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <CalendarIcon size={20} className="text-[#8b5cf6]" />
          Arz Takvimi
        </h3>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={today} className="text-xs font-bold text-[#3b82f6] hover:text-white transition-colors uppercase mr-2">
            Bugün
          </button>
          <button onClick={prevMonth} className="p-1 rounded hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="font-extrabold text-sm sm:text-base min-w-[110px] text-center text-[#e2e8f0]">
            {TURKISH_MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-[1px] bg-[var(--border-color)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        {/* Day Headers */}
        {DAYS.map(day => (
          <div key={day} className="bg-[var(--bg-card)] p-2 text-center text-[10px] sm:text-xs font-bold text-[var(--text-muted)]">
            {day}
          </div>
        ))}
        
        {/* Calendar Cells */}
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="bg-[var(--bg-main)] min-h-[80px] sm:min-h-[100px]" />;
          }

          const isToday = isCurrentMonth && date.getDate() === realToday.getDate();

          // Find events for this date
          const dayEvents = parsedEvents.filter(e => 
            e.date.getDate() === date.getDate() && 
            e.date.getMonth() === date.getMonth() && 
            e.date.getFullYear() === date.getFullYear()
          );

          return (
            <div 
              key={`date-${date.getDate()}`} 
              className={`bg-[var(--bg-card)] min-h-[80px] sm:min-h-[100px] p-1 flex flex-col gap-1 transition-colors hover:bg-[#3b82f6]/5 relative group ${isToday ? 'ring-inset ring-2 ring-[#3b82f6]' : ''}`}
            >
              <span className={`text-xs font-bold text-right px-1 ${isToday ? 'text-[#3b82f6]' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}`}>
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-1 z-10">
                {dayEvents.map((evt, eIdx) => (
                  <div 
                    key={`${evt.ipo.id}-${evt.type}-${eIdx}`}
                    onClick={(e) => { e.stopPropagation(); onIpoClick(evt.ipo); }}
                    className={`cursor-pointer px-1 py-1 text-[8px] sm:text-[9px] font-bold rounded truncate transition-all hover:scale-105 hover:z-20 ${
                      evt.type === 'talep' 
                        ? 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 hover:bg-[#3b82f6] hover:text-white' 
                        : 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 hover:bg-[#10b981] hover:text-white'
                    }`}
                  >
                    {evt.ipo.ticker} {evt.type === 'talep' ? 'TALEP' : 'İŞLEM'}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit, CheckCircle, AlertCircle } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  type: 'irrigation' | 'maintenance' | 'fertilizer';
  valves: string[];
  duration: number; // minutes
}

interface CalendarIntegrationProps {
  onScheduleUpdate: (events: CalendarEvent[]) => void;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ onScheduleUpdate }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    start: '',
    duration: 30,
    type: 'irrigation',
    valves: ['valve1']
  });

  // Simulate Google Calendar connection
  const connectToGoogleCalendar = async () => {
    setIsLoading(true);
    // In real implementation, this would use Google Calendar API
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      // Load sample events
      const sampleEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Jutarnje navodnjavanje',
          start: '2025-01-15T06:00:00',
          end: '2025-01-15T06:30:00',
          type: 'irrigation',
          valves: ['valve1', 'valve2'],
          duration: 30,
          description: 'Redovno jutarnje navodnjavanje'
        },
        {
          id: '2',
          title: 'Večernje navodnjavanje',
          start: '2025-01-15T18:00:00',
          end: '2025-01-15T18:20:00',
          type: 'irrigation',
          valves: ['valve1'],
          duration: 20,
          description: 'Kratko večernje navodnjavanje'
        },
        {
          id: '3',
          title: 'Održavanje sistema',
          start: '2025-01-16T10:00:00',
          end: '2025-01-16T11:00:00',
          type: 'maintenance',
          valves: [],
          duration: 60,
          description: 'Čišćenje filtera i provera senzora'
        }
      ];
      setEvents(sampleEvents);
      onScheduleUpdate(sampleEvents);
    }, 2000);
  };

  const addEvent = () => {
    if (!newEvent.title || !newEvent.start) return;
    
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: newEvent.start,
      end: new Date(new Date(newEvent.start).getTime() + (newEvent.duration || 30) * 60000).toISOString(),
      type: newEvent.type || 'irrigation',
      valves: newEvent.valves || ['valve1'],
      duration: newEvent.duration || 30,
      description: newEvent.description
    };

    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    onScheduleUpdate(updatedEvents);
    setShowAddEvent(false);
    setNewEvent({
      title: '',
      start: '',
      duration: 30,
      type: 'irrigation',
      valves: ['valve1']
    });
  };

  const deleteEvent = (id: string) => {
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    onScheduleUpdate(updatedEvents);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'irrigation': return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
      case 'maintenance': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'fertilizer': return 'bg-green-500/20 border-green-500/50 text-green-300';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'irrigation': return <Calendar className="w-4 h-4" />;
      case 'maintenance': return <Edit className="w-4 h-4" />;
      case 'fertilizer': return <Plus className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('sr-RS'),
      time: date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start) > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Google Calendar Integracija</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {isConnected ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {isConnected ? 'Povezano' : 'Nije povezano'}
          </div>
        </div>

        {!isConnected ? (
          <div className="text-center">
            <p className="text-white/70 mb-4">
              Povežite se sa Google kalendarom za automatsko zakazivanje navodnjavanja
            </p>
            <button
              onClick={connectToGoogleCalendar}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Povezivanje...' : 'Poveži sa Google Calendar'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Kalendar je uspešno povezan</span>
              <button
                onClick={() => setShowAddEvent(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Dodaj događaj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Dodaj novi događaj</h3>
            <button
              onClick={() => setShowAddEvent(false)}
              className="text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Naziv događaja</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50"
                placeholder="npr. Jutarnje navodnjavanje"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Datum i vreme</label>
                <input
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Trajanje (minuti)</label>
                <input
                  type="number"
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({...newEvent, duration: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Tip događaja</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="irrigation">Navodnjavanje</option>
                <option value="maintenance">Održavanje</option>
                <option value="fertilizer">Đubrenje</option>
              </select>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Ventili</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={newEvent.valves?.includes('valve1')}
                    onChange={(e) => {
                      const valves = newEvent.valves || [];
                      if (e.target.checked) {
                        setNewEvent({...newEvent, valves: [...valves, 'valve1']});
                      } else {
                        setNewEvent({...newEvent, valves: valves.filter(v => v !== 'valve1')});
                      }
                    }}
                    className="rounded"
                  />
                  Ventil 1
                </label>
                <label className="flex items-center gap-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={newEvent.valves?.includes('valve2')}
                    onChange={(e) => {
                      const valves = newEvent.valves || [];
                      if (e.target.checked) {
                        setNewEvent({...newEvent, valves: [...valves, 'valve2']});
                      } else {
                        setNewEvent({...newEvent, valves: valves.filter(v => v !== 'valve2')});
                      }
                    }}
                    className="rounded"
                  />
                  Ventil 2
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addEvent}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Dodaj događaj
              </button>
              <button
                onClick={() => setShowAddEvent(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {isConnected && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Nadolazeći događaji</span>
          </div>

          <div className="space-y-3">
            {getUpcomingEvents().length === 0 ? (
              <p className="text-white/70 text-center py-4">Nema zakazanih događaja</p>
            ) : (
              getUpcomingEvents().map((event) => {
                const { date, time } = formatDateTime(event.start);
                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${getEventTypeColor(event.type)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getEventTypeIcon(event.type)}
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm opacity-70">
                            {date} u {time} • {event.duration} min
                          </div>
                          {event.valves.length > 0 && (
                            <div className="text-xs opacity-60">
                              Ventili: {event.valves.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Schedule Summary */}
      {isConnected && events.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Pregled rasporeda</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-300">
                {events.filter(e => e.type === 'irrigation').length}
              </div>
              <div className="text-sm text-blue-200">Navodnjavanje</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-300">
                {events.filter(e => e.type === 'maintenance').length}
              </div>
              <div className="text-sm text-yellow-200">Održavanje</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-300">
                {events.filter(e => e.type === 'fertilizer').length}
              </div>
              <div className="text-sm text-green-200">Đubrenje</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;
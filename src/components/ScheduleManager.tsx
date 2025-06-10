import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Calendar } from 'lucide-react';

interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  type: 'irrigation' | 'maintenance' | 'fertilizer';
  valves: string[];
  duration: number;
  isActive?: boolean;
  nextRun?: string;
}

interface ScheduleManagerProps {
  events: ScheduleEvent[];
  onExecuteEvent: (event: ScheduleEvent) => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ events, onExecuteEvent }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeEvents, setActiveEvents] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check for events that should be executed
    const now = new Date();
    events.forEach(event => {
      const eventTime = new Date(event.start);
      const timeDiff = eventTime.getTime() - now.getTime();
      
      // Execute event if it's time (within 1 minute window)
      if (timeDiff <= 60000 && timeDiff > 0 && !activeEvents.includes(event.id)) {
        setActiveEvents(prev => [...prev, event.id]);
        onExecuteEvent(event);
        
        // Remove from active events after duration
        setTimeout(() => {
          setActiveEvents(prev => prev.filter(id => id !== event.id));
        }, event.duration * 60000);
      }
    });
  }, [currentTime, events, activeEvents, onExecuteEvent]);

  const getNextEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start) > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  };

  const getTimeUntilNext = (eventTime: string) => {
    const now = new Date();
    const event = new Date(eventTime);
    const diff = event.getTime() - now.getTime();
    
    if (diff <= 0) return 'Prošlo';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isEventActive = (eventId: string) => {
    return activeEvents.includes(eventId);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Upravljanje rasporedom</span>
        </div>
        <div className="text-white/70 text-sm">
          {currentTime.toLocaleTimeString('sr-RS')}
        </div>
      </div>

      {/* Next Events */}
      <div className="space-y-4">
        <h3 className="text-white font-medium">Nadolazeći događaji</h3>
        
        {getNextEvents().length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nema zakazanih događaja</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getNextEvents().map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  isEventActive(event.id)
                    ? 'bg-green-500/20 border-green-500/50 animate-pulse'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      event.type === 'irrigation' ? 'bg-blue-500/20' :
                      event.type === 'maintenance' ? 'bg-yellow-500/20' :
                      'bg-green-500/20'
                    }`}>
                      {isEventActive(event.id) ? (
                        <Play className="w-4 h-4 text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{event.title}</div>
                      <div className="text-sm text-white/70">
                        {new Date(event.start).toLocaleString('sr-RS')} • {event.duration} min
                      </div>
                      {event.valves.length > 0 && (
                        <div className="text-xs text-white/50">
                          Ventili: {event.valves.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      isEventActive(event.id) ? 'text-green-400' : 'text-white/70'
                    }`}>
                      {isEventActive(event.id) ? 'AKTIVNO' : getTimeUntilNext(event.start)}
                    </div>
                    {isEventActive(event.id) && (
                      <div className="text-xs text-green-300">
                        Izvršava se...
                      </div>
                    )}
                  </div>
                </div>
                
                {isEventActive(event.id) && (
                  <div className="mt-3 bg-green-500/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-300 text-sm">
                      <Play className="w-4 h-4" />
                      <span>Događaj se trenutno izvršava</span>
                    </div>
                    <div className="mt-2 bg-green-500/20 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${((Date.now() - new Date(event.start).getTime()) / (event.duration * 60000)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Events Summary */}
      {activeEvents.length > 0 && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-300 mb-2">
            <Play className="w-4 h-4" />
            <span className="font-medium">Aktivni događaji ({activeEvents.length})</span>
          </div>
          <div className="text-sm text-green-200">
            Sistem trenutno izvršava zakazane aktivnosti prema kalendaru.
          </div>
        </div>
      )}

      {/* Manual Override */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-300 mb-2">
          <RotateCcw className="w-4 h-4" />
          <span className="font-medium">Ručno upravljanje</span>
        </div>
        <div className="text-sm text-yellow-200 mb-3">
          Možete ručno pokrenuti ili zaustaviti događaje nezavisno od rasporeda.
        </div>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Ručno upravljanje
        </button>
      </div>
    </div>
  );
};

export default ScheduleManager;
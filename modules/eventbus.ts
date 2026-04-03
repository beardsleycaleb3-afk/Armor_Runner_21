/**
 * EventBus: The lone communication hub.
 * This does not point to any other files.
 */

type Callback = (data?: any) => void;

class EventBus {
    private events: { [key: string]: Callback[] } = {};

    /**
     * Subscribe to an event
     */
    on(event: string, callback: Callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, callback: Callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Emit/Trigger an event
     */
    emit(event: string, data?: any) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

export const bus = new EventBus();

import { EventEmitter } from 'events';

export const realtimeEmitter = new EventEmitter();

export const emitGroceryUpdate = (householdId: string, payload: any) => {
  realtimeEmitter.emit('grocery_updated', { householdId, payload });
};

export const emitTaskUpdate = (householdId: string, payload: any) => {
  realtimeEmitter.emit('task_updated', { householdId, payload });
};


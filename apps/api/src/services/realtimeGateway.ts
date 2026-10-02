import { EventEmitter } from 'events';

export const realtimeEmitter = new EventEmitter();

export const emitGroceryUpdate = (householdId: string, payload: any) => {
  realtimeEmitter.emit('grocery_updated', { householdId, payload });
};

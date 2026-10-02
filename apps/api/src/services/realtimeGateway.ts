import { EventEmitter } from 'events';

export const realtimeEmitter = new EventEmitter();

export const emitGroceryUpdate = (householdId: string, payload: any) => {
  realtimeEmitter.emit('grocery_updated', { householdId, payload });
};

export const emitTaskUpdate = (householdId: string, payload: any) => {
  realtimeEmitter.emit('task_updated', { householdId, payload });
};

export const emitHouseholdUpdate = (householdId: string, payload: any) => {
  realtimeEmitter.emit('household_updated', { householdId, payload });
};

export const emitMemberUpdate = (householdId: string, payload: any) => {
  realtimeEmitter.emit('member_updated', { householdId, payload });
};

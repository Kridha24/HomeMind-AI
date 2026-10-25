import { create } from 'zustand';

export interface CallTarget {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface CallStoreState {
  isOpen: boolean;
  targetUser: CallTarget | null;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  incomingSignal: any | null;
  callId?: string;

  // Actions
  startCall: (target: CallTarget, type: 'audio' | 'video') => void;
  receiveCall: (data: {
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    callType?: 'audio' | 'video';
    signalData: any;
    callId?: string;
  }) => void;
  closeCall: () => void;
}

export const useCallStore = create<CallStoreState>((set) => ({
  isOpen: false,
  targetUser: null,
  callType: 'video',
  isIncoming: false,
  incomingSignal: null,
  callId: undefined,

  startCall: (target, type) => {
    set({
      isOpen: true,
      targetUser: target,
      callType: type,
      isIncoming: false,
      incomingSignal: null,
      callId: undefined,
    });
  },

  receiveCall: (data) => {
    set({
      isOpen: true,
      targetUser: {
        id: data.callerId,
        name: data.callerName,
        avatar: data.callerAvatar,
      },
      callType: data.callType || 'video',
      isIncoming: true,
      incomingSignal: data.signalData,
      callId: data.callId,
    });
  },

  closeCall: () => {
    set({
      isOpen: false,
      targetUser: null,
      isIncoming: false,
      incomingSignal: null,
      callId: undefined,
    });
  },
}));

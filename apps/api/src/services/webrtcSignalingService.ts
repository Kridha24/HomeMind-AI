import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../repositories/db';
import { DeviceTokenService } from '../modules/communication/deviceTokenService';

export interface CallSession {
  callId: string;
  householdId: string;
  callerId: string;
  calleeId: string;
  callType: 'audio' | 'video';
  status: 'calling' | 'connected' | 'ended' | 'expired';
  startedAt: number;
  expiresAt: number;
  connectedAt?: number;
  timeoutTimer?: NodeJS.Timeout;
}

export class WebRTCSignalingManager {
  private activeCalls = new Map<string, CallSession>();
  // Index for quick lookup of active call by participant ID
  private userToCallMap = new Map<string, string>();

  /**
   * Helper to check if a user is currently in an active (calling/connected) call
   */
  public isUserInCall(userId: string): boolean {
    const callId = this.userToCallMap.get(userId);
    if (!callId) return false;
    const session = this.activeCalls.get(callId);
    return Boolean(session && session.status !== 'ended' && session.status !== 'expired');
  }

  /**
   * Get active call for a user
   */
  public getActiveCallForUser(userId: string): CallSession | undefined {
    const callId = this.userToCallMap.get(userId);
    if (!callId) return undefined;
    return this.activeCalls.get(callId);
  }

  /**
   * Get call session by callId
   */
  public getCallSession(callId: string): CallSession | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Force expire a call (used for testing call timeout behavior)
   */
  public expireCallForTesting(callId: string): void {
    const session = this.activeCalls.get(callId);
    if (session) {
      if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
      session.status = 'expired';
      session.expiresAt = Date.now() - 1000;
    }
  }

  /**
   * Initiate a call with household boundary enforcement & busy checks
   */
  public async handleCallUser(
    io: SocketIOServer,
    callerId: string,
    callerHouseholdId: string,
    data: {
      callId?: string;
      targetUserId: string;
      signalData: any;
      callType: 'audio' | 'video';
      callerName: string;
      callerAvatar?: string;
    }
  ): Promise<{ success: boolean; error?: string; callId?: string }> {
    const { targetUserId, signalData, callType, callerName, callerAvatar } = data;

    if (!callerId || !targetUserId) {
      return { success: false, error: 'Caller and callee IDs are required' };
    }

    if (callerId === targetUserId) {
      return { success: false, error: 'Cannot call yourself' };
    }

    // Fetch live caller and callee profiles from DB to prevent stale token mismatches
    const [caller, callee] = await Promise.all([
      prisma.user.findUnique({
        where: { id: callerId },
        select: { id: true, householdId: true, name: true },
      }),
      targetUserId === 'household'
        ? null
        : prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, householdId: true, name: true },
          }),
    ]);

    const effectiveCallerHouseholdId = caller?.householdId || callerHouseholdId;
    const isHouseholdCall = targetUserId === 'household' || targetUserId === effectiveCallerHouseholdId || targetUserId === callerHouseholdId;

    if (isHouseholdCall) {
      // Clean up caller's previous session if any
      const callerCallId = this.userToCallMap.get(callerId);
      if (callerCallId) {
        const callerSession = this.activeCalls.get(callerCallId);
        if (callerSession && callerSession.status === 'calling') {
          if (callerSession.timeoutTimer) clearTimeout(callerSession.timeoutTimer);
          this.activeCalls.delete(callerCallId);
          this.userToCallMap.delete(callerSession.callerId);
          this.userToCallMap.delete(callerSession.calleeId);
        }
      }

      const callId = data.callId || `call_group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = Date.now() + 45000;

      const timeoutTimer = setTimeout(() => {
        const active = this.activeCalls.get(callId);
        if (active && active.status === 'calling') {
          console.log(`[WebRTC] Household group call invitation timed out [${callId}]`);
          active.status = 'expired';
          this.activeCalls.delete(callId);
          this.userToCallMap.delete(callerId);

          io.to(`household_${effectiveCallerHouseholdId}`).emit('webrtc_call_ended', {
            callId,
            reason: 'Call invitation timed out',
          });
        }
      }, 45000);

      const session: CallSession = {
        callId,
        householdId: effectiveCallerHouseholdId,
        callerId,
        calleeId: 'household',
        callType: callType || 'video',
        status: 'calling',
        startedAt: Date.now(),
        expiresAt,
        timeoutTimer,
      };

      this.activeCalls.set(callId, session);
      this.userToCallMap.set(callerId, callId);

      console.log(`[WebRTC] Broadcasted Family Group Call to household_${effectiveCallerHouseholdId} from ${callerId} (${callType})`);

      // Relay incoming call to all other members in the household simultaneously!
      io.to(`household_${effectiveCallerHouseholdId}`).except(`user_${callerId}`).emit('webrtc_incoming_call', {
        callId,
        callerId,
        callerName: `${callerName} (Family Group Call)`,
        callerAvatar,
        callType,
        signalData,
        isGroupCall: true,
      });

      return { success: true, callId };
    }

    // 1. Verify caller and callee exist (Cross-Household Defense)
    if (!callee || !callee.householdId) {
      io.to(`user_${callerId}`).emit('webrtc_call_error', {
        error: 'Target user not found or has no active household',
      });
      return { success: false, error: 'Target user not found' };
    }

    // Determine authorization:
    // 1. Do caller and callee share the same household in the live DB?
    const liveHouseholdMatch = Boolean(caller?.householdId && callee.householdId && caller.householdId === callee.householdId);
    
    // 2. Does caller's token match callee's household (or vice versa)?
    const tokenHouseholdMatch = Boolean(
      (callerHouseholdId && callee.householdId && callerHouseholdId === callee.householdId) ||
      (caller?.householdId && callerHouseholdId && caller.householdId === callerHouseholdId)
    );

    let isAuthorizedFamily = liveHouseholdMatch || tokenHouseholdMatch;

    // 3. Fallback: Do they share any conversation (DIRECT or HOUSEHOLD) in the DB?
    if (!isAuthorizedFamily && caller && callee) {
      const sharedMembership = await prisma.conversationMember.findFirst({
        where: {
          userId: callerId,
          conversation: {
            members: {
              some: { userId: targetUserId }
            }
          }
        }
      });
      if (sharedMembership) {
        isAuthorizedFamily = true;
      }
    }

    if (!isAuthorizedFamily) {
      console.warn(
        `[WebRTC Security Alert] Cross-household call rejected: caller ${callerId} (HH: ${caller?.householdId || callerHouseholdId}) attempted to call ${targetUserId} (HH: ${callee.householdId})`
      );
      io.to(`user_${callerId}`).emit('webrtc_call_error', {
        error: 'Unauthorized: Cross-household calling is strictly prohibited',
      });
      return { success: false, error: 'Cross-household calling prohibited' };
    }

    const effectiveCallHouseholdId = caller?.householdId || callee.householdId || callerHouseholdId;

    // 2. Clean up any stale or pending calling sessions for caller or between caller and callee
    const callerCallId = this.userToCallMap.get(callerId);
    if (callerCallId) {
      const callerSession = this.activeCalls.get(callerCallId);
      if (callerSession && callerSession.status === 'calling') {
        if (callerSession.timeoutTimer) clearTimeout(callerSession.timeoutTimer);
        this.activeCalls.delete(callerCallId);
        this.userToCallMap.delete(callerSession.callerId);
        this.userToCallMap.delete(callerSession.calleeId);
        console.log(`[WebRTC] Cleared caller's previous unanswered call [${callerCallId}]`);
      }
    }

    const calleeCallId = this.userToCallMap.get(targetUserId);
    if (calleeCallId) {
      const calleeSession = this.activeCalls.get(calleeCallId);
      if (calleeSession && calleeSession.status === 'calling') {
        // If the pending call on callee was with THIS caller, or older than 8 seconds, clear it so new call proceeds
        if (
          calleeSession.callerId === callerId ||
          calleeSession.calleeId === callerId ||
          Date.now() - calleeSession.startedAt > 8000
        ) {
          if (calleeSession.timeoutTimer) clearTimeout(calleeSession.timeoutTimer);
          this.activeCalls.delete(calleeCallId);
          this.userToCallMap.delete(calleeSession.callerId);
          this.userToCallMap.delete(calleeSession.calleeId);
          console.log(`[WebRTC] Cleared callee's previous calling session [${calleeCallId}] between same users`);
        }
      }
    }

    // 3. Check if Callee is already BUSY
    if (this.isUserInCall(targetUserId)) {
      console.log(`[WebRTC] Callee ${targetUserId} is currently busy in another call`);
      io.to(`user_${callerId}`).emit('webrtc_call_busy', {
        targetUserId,
        reason: 'busy',
        message: `${callee.name} is currently in another call`,
      });
      return { success: false, error: 'Callee is busy' };
    }

    // 4. Check if Caller is already in a call
    if (this.isUserInCall(callerId)) {
      return { success: false, error: 'Caller already engaged in an active call' };
    }

    // 5. Generate unique unpredictable Call ID
    const callId = data.callId || `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 45000; // 45 seconds call invitation window

    // 6. Automatic Call Timeout Handler
    const timeoutTimer = setTimeout(() => {
      const active = this.activeCalls.get(callId);
      if (active && active.status === 'calling') {
        console.log(`[WebRTC] Call invitation timed out after 45s for [${callId}]`);
        active.status = 'expired';
        this.activeCalls.delete(callId);
        this.userToCallMap.delete(callerId);
        this.userToCallMap.delete(targetUserId);

        io.to(`user_${callerId}`).emit('webrtc_call_ended', {
          callId,
          reason: 'Call invitation timed out',
        });
        io.to(`user_${targetUserId}`).emit('webrtc_call_ended', {
          callId,
          reason: 'Call invitation timed out',
        });
      }
    }, 45000);

    const session: CallSession = {
      callId,
      householdId: effectiveCallHouseholdId,
      callerId,
      calleeId: targetUserId,
      callType: callType || 'video',
      status: 'calling',
      startedAt: Date.now(),
      expiresAt,
      timeoutTimer,
    };

    this.activeCalls.set(callId, session);
    this.userToCallMap.set(callerId, callId);
    this.userToCallMap.set(targetUserId, callId);

    console.log(`[WebRTC] Call initiated [${callId}]: ${callerId} -> ${targetUserId} (${callType})`);

    // 7. Relay incoming call to callee via Socket.IO
    io.to(`user_${targetUserId}`).emit('webrtc_incoming_call', {
      callId,
      callerId,
      callerName,
      callerAvatar,
      callType,
      signalData,
    });

    // 8. Dispatch High-Priority Android/iOS Call Notification
    // Security Rule: NEVER send SDP, ICE candidates, JWT, or TURN credentials in push notification payload!
    const sanitizedPushPayload = {
      type: 'INCOMING_CALL',
      callId,
      callerId,
      callerName,
      callerAvatar,
      callType,
      householdId: effectiveCallHouseholdId,
    };

    DeviceTokenService.getUserTokens(targetUserId)
      .then((tokens) => {
        if (tokens.length > 0) {
          console.log(
            `[WebRTC Push] Dispatched high-priority call notification for [${callId}] to ${tokens.length} devices`
          );
        }
      })
      .catch((err) => {
        console.warn('[WebRTC Push] Error dispatching device push notification:', err);
      });

    return { success: true, callId };
  }

  /**
   * Handle Answer Call
   */
  public handleAnswerCall(
    io: SocketIOServer,
    responderId: string,
    data: {
      callId: string;
      targetUserId: string;
      signalData: any;
    }
  ): boolean {
    const { callId, targetUserId, signalData } = data;
    const session = this.activeCalls.get(callId);

    if (!session || session.status === 'ended' || session.status === 'expired') {
      console.warn(`[WebRTC] Rejecting answer: Call session ${callId} does not exist or has expired`);
      return false;
    }

    if (Date.now() > session.expiresAt) {
      console.warn(`[WebRTC] Rejecting answer: Call invitation ${callId} has expired past 45s window`);
      if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
      session.status = 'expired';
      this.activeCalls.delete(callId);
      this.userToCallMap.delete(session.callerId);
      this.userToCallMap.delete(session.calleeId);

      io.to(`user_${responderId}`).emit('webrtc_call_error', {
        error: 'Call invitation has expired',
      });
      return false;
    }

    const isHouseholdCall = session.calleeId === 'household';

    if (!isHouseholdCall && (session.calleeId !== responderId || session.callerId !== targetUserId)) {
      console.warn(`[WebRTC Security Alert] Forged answer rejected for call ${callId}`);
      return false;
    }

    if (isHouseholdCall) {
      session.calleeId = responderId;
      this.userToCallMap.set(responderId, callId);
      // Cancel ringing on other household members' devices since call was picked up
      io.to(`household_${session.householdId}`).except(`user_${responderId}`).except(`user_${session.callerId}`).emit('webrtc_call_ended', {
        callId,
        reason: 'Call answered on another device',
      });
    }

    // Cancel expiration timer upon answer
    if (session.timeoutTimer) {
      clearTimeout(session.timeoutTimer);
      session.timeoutTimer = undefined;
    }

    session.status = 'connected';
    session.connectedAt = Date.now();

    console.log(`[WebRTC] Call accepted [${callId}]: ${responderId} answered ${targetUserId}`);

    io.to(`user_${session.callerId}`).emit('webrtc_call_accepted', {
      callId,
      signalData,
      fromUserId: responderId,
    });

    return true;
  }

  /**
   * Handle ICE Candidate Relay with session validation
   */
  public handleIceCandidate(
    io: SocketIOServer,
    senderId: string,
    data: {
      callId?: string;
      targetUserId: string;
      candidate: any;
    }
  ): boolean {
    const { callId, targetUserId, candidate } = data;

    // Validate active call session
    let session: CallSession | undefined;
    if (callId) {
      session = this.activeCalls.get(callId);
    } else {
      const mappedCallId = this.userToCallMap.get(senderId);
      if (mappedCallId) session = this.activeCalls.get(mappedCallId);
    }

    if (!session || session.status === 'ended') {
      return false;
    }

    // Validate sender and recipient belong to this active session
    const isCaller = session.callerId === senderId && session.calleeId === targetUserId;
    const isCallee = session.calleeId === senderId && session.callerId === targetUserId;

    if (!isCaller && !isCallee) {
      console.warn(`[WebRTC Security Alert] Unauthorized candidate relay attempt between ${senderId} and ${targetUserId}`);
      return false;
    }

    io.to(`user_${targetUserId}`).emit('webrtc_ice_candidate', {
      callId: session.callId,
      candidate,
      fromUserId: senderId,
    });

    return true;
  }

  /**
   * End Call & Clean Up
   */
  public handleEndCall(
    io: SocketIOServer,
    senderId: string,
    data: {
      callId?: string;
      targetUserId: string;
    }
  ): void {
    const { callId, targetUserId } = data;
    const activeCallId = callId || this.userToCallMap.get(senderId);

    if (activeCallId) {
      const session = this.activeCalls.get(activeCallId);
      if (session) {
        if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
        const durationSec = session.connectedAt ? Math.round((Date.now() - session.connectedAt) / 1000) : 0;
        console.log(`[WebRTC] Call ended [${activeCallId}], duration: ${durationSec}s`);
        this.activeCalls.delete(activeCallId);
        this.userToCallMap.delete(session.callerId);
        this.userToCallMap.delete(session.calleeId);
      }
    }

    io.to(`user_${targetUserId}`).emit('webrtc_call_ended', {
      callId: activeCallId,
      fromUserId: senderId,
    });
  }

  /**
   * Reject Call
   */
  public handleRejectCall(
    io: SocketIOServer,
    responderId: string,
    data: {
      callId?: string;
      targetUserId: string;
      reason?: string;
    }
  ): void {
    const { callId, targetUserId, reason } = data;
    const activeCallId = callId || this.userToCallMap.get(responderId);

    if (activeCallId) {
      const session = this.activeCalls.get(activeCallId);
      if (session) {
        if (session.calleeId === 'household') {
          // If a member declines a group call, do not cancel for other household members
          console.log(`[WebRTC] Group call declined by member ${responderId}`);
          return;
        }
        if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
        this.activeCalls.delete(activeCallId);
        this.userToCallMap.delete(session.callerId);
        this.userToCallMap.delete(session.calleeId);
      }
    }

    console.log(`[WebRTC] Call rejected by ${responderId} for ${targetUserId} (reason: ${reason || 'declined'})`);

    io.to(`user_${targetUserId}`).emit('webrtc_call_rejected', {
      callId: activeCallId,
      fromUserId: responderId,
      reason: reason || 'declined',
    });
  }

  /**
   * Toggle Media state
   */
  public handleToggleMedia(
    io: SocketIOServer,
    senderId: string,
    data: {
      callId?: string;
      targetUserId: string;
      isAudioMuted?: boolean;
      isVideoOff?: boolean;
    }
  ): void {
    const { callId, targetUserId, isAudioMuted, isVideoOff } = data;
    io.to(`user_${targetUserId}`).emit('webrtc_media_state', {
      callId,
      fromUserId: senderId,
      isAudioMuted,
      isVideoOff,
    });
  }

  /**
   * Handle user disconnection
   */
  public handleDisconnect(io: SocketIOServer, userId: string): void {
    const callId = this.userToCallMap.get(userId);
    if (!callId) return;

    const session = this.activeCalls.get(callId);
    if (!session) return;

    if (session.timeoutTimer) clearTimeout(session.timeoutTimer);

    const targetUserId = session.callerId === userId ? session.calleeId : session.callerId;

    console.log(`[WebRTC] Peer ${userId} disconnected during call ${callId}`);

    io.to(`user_${targetUserId}`).emit('webrtc_call_ended', {
      callId,
      fromUserId: userId,
      reason: 'peer_disconnected',
    });

    this.activeCalls.delete(callId);
    this.userToCallMap.delete(session.callerId);
    this.userToCallMap.delete(session.calleeId);
  }

  /**
   * Clear all active sessions (e.g. for testing)
   */
  public clearAll(): void {
    for (const session of this.activeCalls.values()) {
      if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
    }
    this.activeCalls.clear();
    this.userToCallMap.clear();
  }
}

export const webrtcSignaling = new WebRTCSignalingManager();

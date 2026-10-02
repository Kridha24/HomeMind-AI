import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  ShieldCheck,
  Volume2,
  VolumeX,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../stores/useAuthStore';

export type CallState =
  | 'IDLE'
  | 'INITIATING'
  | 'RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'REJECTED'
  | 'BUSY'
  | 'FAILED'
  | 'ENDED';

interface FamilyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  } | null;
  callType: 'audio' | 'video';
  isIncoming?: boolean;
  incomingSignal?: any;
  callId?: string;
}

/**
 * Configure STUN and optional TURN servers from environment or defaults
 */
const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Optional custom STUN URLs
  const envStun = import.meta.env.VITE_WEBRTC_STUN_URLS;
  if (envStun) {
    envStun.split(',').forEach((url: string) => {
      const trimmed = url.trim();
      if (trimmed) servers.push({ urls: trimmed });
    });
  }

  // Optional Production TURN server
  const turnUrl = import.meta.env.VITE_WEBRTC_TURN_URL;
  const turnUser = import.meta.env.VITE_WEBRTC_TURN_USERNAME;
  const turnCred = import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: turnUser || undefined,
      credential: turnCred || undefined,
    });
  }

  return servers;
};

export const FamilyCallModal: React.FC<FamilyCallModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  callType = 'video',
  isIncoming = false,
  incomingSignal,
  callId,
}) => {
  const { user } = useAuthStore();

  // Typed Call State Machine
  const [callState, setCallState] = useState<CallState>(
    isIncoming ? 'RINGING' : 'INITIATING'
  );

  // Local Media states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Remote peer state
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(callType === 'audio');

  // Connection Topology (detected via getStats)
  const [topology, setTopology] = useState<'direct' | 'relay' | 'unknown'>('unknown');

  // Timer & diagnostics
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callSessionIdRef = useRef<string>(
    callId || `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );

  useEffect(() => {
    if (callId) {
      callSessionIdRef.current = callId;
    }
  }, [callId]);

  // Screen share availability check (Unsupported on Android native WebViews)
  const isScreenShareSupported =
    !Capacitor.isNativePlatform() &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function';

  // Format Duration seconds to MM:SS
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Start duration timer strictly when connection becomes active
  const startTimer = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // Stop timer and clean up
  const stopTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // Detect whether connection is Direct P2P or TURN Relay
  const detectTopology = useCallback(async (pc: RTCPeerConnection) => {
    try {
      const stats = await pc.getStats();
      let detectedType: 'direct' | 'relay' = 'direct';

      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localCandidate = stats.get(report.localCandidateId);
          const remoteCandidate = stats.get(report.remoteCandidateId);

          if (
            localCandidate?.candidateType === 'relay' ||
            remoteCandidate?.candidateType === 'relay'
          ) {
            detectedType = 'relay';
          }
        }
      });

      setTopology(detectedType);
    } catch {
      setTopology('direct');
    }
  }, []);

  // Clean Up All Media and WebRTC Resources
  const cleanUpCall = useCallback(() => {
    stopTimer();

    // 1. Stop all local audio/video media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
    }

    // 2. Close and destroy RTCPeerConnection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 3. Clear video element bindings
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // 4. Clear pending candidate queues
    pendingIceCandidatesRef.current = [];
    setIsScreenSharing(false);
    setCallDuration(0);
  }, [stopTimer]);

  // Request Local User Media (Microphone & Camera)
  const getLocalMedia = async (videoRequired: boolean): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: videoRequired
          ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: 'user',
            }
          : false,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current && videoRequired) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] Media access error:', err.name, err.message);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera or microphone permission was denied. Please allow device access.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera or microphone found on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('Camera/microphone is already in use by another application.');
      } else {
        // Fallback to audio-only if video failed
        if (videoRequired) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = audioStream;
            setIsVideoOff(true);
            return audioStream;
          } catch {
            setErrorMessage('Could not access microphone or camera.');
          }
        } else {
          setErrorMessage('Could not access microphone.');
        }
      }
      return null;
    }
  };

  // 1. Drain Pending ICE candidates safely after remote description is set
  const drainPendingIceCandidates = async (pc: RTCPeerConnection) => {
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Candidate drainage error:', e);
        }
      }
    }
  };

  // 2. Setup RTCPeerConnection Event Handlers
  const setupPeerConnection = (pc: RTCPeerConnection, targetUserId: string) => {
    // Track remote media
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote media track received:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send local ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.getSocket()?.emit('webrtc_ice_candidate', {
          callId: callSessionIdRef.current,
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Peer Connection State Change
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('CONNECTED');
        startTimer();
        detectTopology(pc);
      } else if (pc.connectionState === 'connecting') {
        setCallState('CONNECTING');
      } else if (pc.connectionState === 'disconnected') {
        setCallState('RECONNECTING');
      } else if (pc.connectionState === 'failed') {
        setCallState('FAILED');
        setErrorMessage('Call connection failed. Please check network/firewall.');
      } else if (pc.connectionState === 'closed') {
        setCallState('ENDED');
      }
    };

    // Fallback ICE Connection State Change
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallState('CONNECTED');
        startTimer();
        detectTopology(pc);
      } else if (pc.iceConnectionState === 'disconnected') {
        setCallState('RECONNECTING');
      } else if (pc.iceConnectionState === 'failed') {
        setCallState('FAILED');
        setErrorMessage('Connection failed. STUN/TURN unavailable or restricted network.');
      }
    };
  };

  // 3. Initiate Outgoing Call
  const initiateOutgoingCall = async (targetUserId: string) => {
    setCallState('INITIATING');
    const stream = await getLocalMedia(callType === 'video');
    if (!stream) {
      setCallState('FAILED');
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    peerConnectionRef.current = pc;
    setupPeerConnection(pc, targetUserId);

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    try {
      setCallState('CONNECTING');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.getSocket()?.emit('webrtc_call_user', {
        callId: callSessionIdRef.current,
        targetUserId,
        signalData: offer,
        callType,
        callerName: user?.name || 'Family Member',
        callerAvatar: user?.avatar,
      });
    } catch (e) {
      console.error('[WebRTC] Failed to create offer:', e);
      setCallState('FAILED');
      setErrorMessage('Failed to initiate call.');
    }
  };

  // 4. Accept Incoming Call
  const handleAcceptCall = async () => {
    if (!targetUser || !incomingSignal) return;

    setCallState('CONNECTING');
    const stream = await getLocalMedia(callType === 'video');
    if (!stream) {
      setCallState('FAILED');
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    peerConnectionRef.current = pc;
    setupPeerConnection(pc, targetUser.id);

    // Add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
      await drainPendingIceCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.getSocket()?.emit('webrtc_answer_call', {
        callId: callSessionIdRef.current,
        targetUserId: targetUser.id,
        signalData: answer,
      });
    } catch (e) {
      console.error('[WebRTC] Failed to answer call:', e);
      setCallState('FAILED');
      setErrorMessage('Failed to establish peer connection.');
    }
  };

  // 5. Decline or End Call
  const handleEndCall = () => {
    if (targetUser) {
      if (callState === 'RINGING' || isIncoming) {
        socketService.getSocket()?.emit('webrtc_reject_call', {
          callId: callSessionIdRef.current,
          targetUserId: targetUser.id,
          reason: 'declined',
        });
      } else {
        socketService.getSocket()?.emit('webrtc_end_call', {
          callId: callSessionIdRef.current,
          targetUserId: targetUser.id,
        });
      }
    }
    setCallState('ENDED');
    cleanUpCall();
    onClose();
  };

  // 6. Media Toggles
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);

        if (targetUser) {
          socketService.getSocket()?.emit('webrtc_toggle_media', {
            callId: callSessionIdRef.current,
            targetUserId: targetUser.id,
            isAudioMuted: !audioTrack.enabled,
          });
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);

        if (targetUser) {
          socketService.getSocket()?.emit('webrtc_toggle_media', {
            callId: callSessionIdRef.current,
            targetUserId: targetUser.id,
            isVideoOff: !videoTrack.enabled,
          });
        }
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerMuted;
    }
    setIsSpeakerMuted((prev) => !prev);
  };

  // 7. Screen Sharing (Web only with track replacement)
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current || !isScreenShareSupported) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('[WebRTC] Screen share cancelled or failed:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender && videoTrack) {
        await videoSender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  // Socket Lifecycle & Event Listeners
  useEffect(() => {
    if (!isOpen) {
      cleanUpCall();
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) {
      setErrorMessage('Real-time connection unavailable.');
      setCallState('FAILED');
      return;
    }

    // Call Accepted by Callee
    const handleCallAccepted = async (data: { signalData: any; fromUserId: string }) => {
      console.log('[WebRTC] Call accepted by peer');
      const pc = peerConnectionRef.current;
      if (pc && data.signalData) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signalData));
          await drainPendingIceCandidates(pc);
        } catch (e) {
          console.error('[WebRTC] Failed to set remote description on accept:', e);
        }
      }
    };

    // ICE Candidate from Peer
    const handleIceCandidate = async (data: { candidate: any }) => {
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        // Queue candidate until remoteDescription is set
        pendingIceCandidatesRef.current.push(data.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error('[WebRTC] Failed to add remote ICE candidate:', e);
      }
    };

    // Peer Ended Call
    const handleCallEnded = () => {
      console.log('[WebRTC] Peer ended call');
      setCallState('ENDED');
      setTimeout(() => {
        onClose();
      }, 1000);
    };

    // Peer Rejected Call
    const handleCallRejected = (data?: { reason?: string }) => {
      console.log('[WebRTC] Peer rejected call:', data?.reason);
      setCallState('REJECTED');
      setErrorMessage(
        data?.reason === 'declined' ? 'Call was declined.' : 'Call was unanswered.'
      );
      setTimeout(() => {
        onClose();
      }, 1500);
    };

    // Peer is Busy
    const handleCallBusy = (data?: { message?: string }) => {
      console.log('[WebRTC] Callee is busy:', data?.message);
      setCallState('BUSY');
      setErrorMessage(data?.message || 'Family member is currently in another call.');
      setTimeout(() => {
        onClose();
      }, 2500);
    };

    // Server-side Call Error (e.g. cross-household rejection)
    const handleCallError = (data: { error: string }) => {
      console.error('[WebRTC] Server call error:', data.error);
      setCallState('FAILED');
      setErrorMessage(data.error || 'Call failed due to authorization restriction.');
    };

    // Remote Peer Media State Toggled
    const handleRemoteMediaState = (data: { isAudioMuted?: boolean; isVideoOff?: boolean }) => {
      if (data.isAudioMuted !== undefined) setRemoteAudioMuted(data.isAudioMuted);
      if (data.isVideoOff !== undefined) setRemoteVideoOff(data.isVideoOff);
    };

    socket.on('webrtc_call_accepted', handleCallAccepted);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('webrtc_call_ended', handleCallEnded);
    socket.on('webrtc_call_rejected', handleCallRejected);
    socket.on('webrtc_call_busy', handleCallBusy);
    socket.on('webrtc_call_error', handleCallError);
    socket.on('webrtc_media_state', handleRemoteMediaState);

    // If Outgoing Call: Initialize camera/mic and send offer
    if (!isIncoming && targetUser) {
      initiateOutgoingCall(targetUser.id);
    }

    // Navigation Safety: Warn user before leaving active call
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (callState === 'CONNECTED' || callState === 'CONNECTING') {
        e.preventDefault();
        e.returnValue = 'You have an active call. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      socket.off('webrtc_call_accepted', handleCallAccepted);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('webrtc_call_ended', handleCallEnded);
      socket.off('webrtc_call_rejected', handleCallRejected);
      socket.off('webrtc_call_busy', handleCallBusy);
      socket.off('webrtc_call_error', handleCallError);
      socket.off('webrtc_media_state', handleRemoteMediaState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, isIncoming, targetUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[720px] bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Top Floating Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 pointer-events-auto shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
              {targetUser?.name?.charAt(0) || 'F'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-none">
                {targetUser?.name || 'Family Call'}
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {callState === 'CONNECTED'
                  ? formatDuration(callDuration)
                  : callState === 'RINGING'
                  ? 'Incoming Call...'
                  : callState === 'CONNECTING'
                  ? 'Connecting...'
                  : callState === 'RECONNECTING'
                  ? 'Reconnecting...'
                  : callState === 'BUSY'
                  ? 'Busy'
                  : 'Calling...'}
              </span>
            </div>
          </div>

          {/* Accurate Dynamic WebRTC Security Badge */}
          <div
            className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto shadow-sm"
            title="Audio and video are protected by WebRTC's encrypted media transport (DTLS-SRTP)."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {topology === 'direct'
                ? '🔒 Encrypted Direct Call (DTLS-SRTP)'
                : topology === 'relay'
                ? '🔒 Encrypted Relay Call (TURN DTLS-SRTP)'
                : '🔒 Encrypted Call (DTLS-SRTP)'}
            </span>
          </div>
        </div>

        {/* Central Video / Audio Stage */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Remote Video Stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              callState === 'CONNECTED' && !remoteVideoOff ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Audio Wave / Avatar Screen (When Audio-only, Video is Off, or Connecting) */}
          {(callState !== 'CONNECTED' || remoteVideoOff) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 z-10 p-4">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-2xl border-4 border-slate-800">
                  {targetUser?.name?.charAt(0) || 'F'}
                </div>
                {callState === 'CONNECTED' && (
                  <div className="absolute -inset-3 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none opacity-40" />
                )}
                {(callState === 'CONNECTING' || callState === 'INITIATING') && (
                  <div className="absolute -inset-4 rounded-full border-2 border-blue-400 animate-pulse pointer-events-none opacity-50" />
                )}
              </div>

              <div className="text-center space-y-2.5">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {targetUser?.name || 'Family Member'}
                </h3>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                    {callType === 'video' ? (
                      <>
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Call</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-3.5 h-3.5" />
                        <span>Audio Call</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="pt-1">
                  {callState === 'CONNECTED' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Connected • {formatDuration(callDuration)}</span>
                    </span>
                  ) : callState === 'RINGING' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...</span>
                    </span>
                  ) : callState === 'RECONNECTING' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>Reconnecting network...</span>
                    </span>
                  ) : callState === 'BUSY' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>User is currently busy on another call</span>
                    </span>
                  ) : callState === 'FAILED' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Connection failed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                      <span>Connecting...</span>
                    </span>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2 max-w-sm text-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Local User PIP Video */}
          <div className="absolute bottom-6 right-4 sm:right-6 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl bg-slate-900 border-2 border-slate-700/80 overflow-hidden shadow-2xl z-20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isVideoOff ? 'hidden' : 'block'
              }`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs font-bold">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                <span>Camera Off</span>
              </div>
            )}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-[9px] font-bold text-white backdrop-blur-xs">
              You
            </span>
          </div>
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="p-4 sm:p-6 bg-slate-950/95 border-t border-slate-800/80 z-20 flex flex-col items-center justify-center gap-4">
          {callState === 'RINGING' ? (
            /* Incoming Call Actions */
            <div className="flex items-center gap-8">
              <button
                onClick={handleEndCall}
                className="flex flex-col items-center gap-1.5 group"
                title="Decline Call"
              >
                <div className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/35 active:scale-95 transition-all">
                  <PhoneOff className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-red-400">
                  Decline
                </span>
              </button>

              <button
                onClick={handleAcceptCall}
                className="flex flex-col items-center gap-1.5 group animate-bounce"
                title="Accept Call"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 active:scale-95 transition-all">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-400">
                  Accept
                </span>
              </button>
            </div>
          ) : (
            /* Connected / Calling Action Controls */
            <div className="w-full max-w-md flex flex-col items-center gap-4">
              {/* Media Action Row */}
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* 🎤 Mic Toggle */}
                <button
                  onClick={toggleAudio}
                  className="flex flex-col items-center gap-1 group"
                  title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                      isAudioMuted
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-slate-800/80 border-slate-700 text-white group-hover:bg-slate-700'
                    }`}
                  >
                    {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {isAudioMuted ? 'Unmute' : 'Mute'}
                  </span>
                </button>

                {/* 📹 Video Toggle */}
                <button
                  onClick={toggleVideo}
                  className="flex flex-col items-center gap-1 group"
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                      isVideoOff
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-slate-800/80 border-slate-700 text-white group-hover:bg-slate-700'
                    }`}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {isVideoOff ? 'Start Video' : 'Stop Video'}
                  </span>
                </button>

                {/* 🔊 Speaker Toggle */}
                <button
                  onClick={toggleSpeaker}
                  className="flex flex-col items-center gap-1 group"
                  title={isSpeakerMuted ? 'Unmute Audio Playback' : 'Mute Audio Playback'}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                      isSpeakerMuted
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-slate-800/80 border-slate-700 text-white group-hover:bg-slate-700'
                    }`}
                  >
                    {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {isSpeakerMuted ? 'Unmute' : 'Speaker'}
                  </span>
                </button>

                {/* 🖥️ Screen Share (Web Only) */}
                {isScreenShareSupported && (
                  <button
                    onClick={toggleScreenShare}
                    className="flex flex-col items-center gap-1 group"
                    title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                        isScreenSharing
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/35'
                          : 'bg-slate-800/80 border-slate-700 text-white group-hover:bg-slate-700'
                      }`}
                    >
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {isScreenSharing ? 'Sharing' : 'Share'}
                    </span>
                  </button>
                )}
              </div>

              {/* 🔴 Prominent Centered End Call Button */}
              <button
                onClick={handleEndCall}
                className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/35 active:scale-95 transition-all"
                title="End Call"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <PhoneOff className="w-3.5 h-3.5 text-white" />
                </div>
                <span>End Call</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyCallModal;

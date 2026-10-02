import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  ShieldCheck,
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Radio,
  Clock,
  PhoneIncoming,
} from 'lucide-react';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../stores/useAuthStore';

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
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const FamilyCallModal: React.FC<FamilyCallModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  callType = 'video',
  isIncoming = false,
  incomingSignal,
}) => {
  const { user } = useAuthStore();
  const [callStatus, setCallStatus] = useState<'calling' | 'incoming' | 'connected' | 'ended'>(
    isIncoming ? 'incoming' : 'calling'
  );
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Media and WebRTC
  useEffect(() => {
    if (!isOpen) {
      cleanUpCall();
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) {
      setErrorMessage('Real-time server connection unavailable.');
      return;
    }

    // Handle Incoming WebRTC Events
    const handleCallAccepted = async (data: { signalData: any; fromUserId: string }) => {
      console.log('[WebRTC] Call accepted by peer');
      if (peerConnectionRef.current && data.signalData) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signalData));
          setCallStatus('connected');
          startTimer();
        } catch (e) {
          console.error('[WebRTC] Failed to set remote description on accept', e);
        }
      }
    };

    const handleIceCandidate = async (data: { candidate: any }) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('[WebRTC] Failed to add ICE candidate', e);
        }
      }
    };

    const handleCallEnded = () => {
      console.log('[WebRTC] Peer ended the call');
      setCallStatus('ended');
      setTimeout(() => {
        onClose();
      }, 1200);
    };

    const handleCallRejected = () => {
      console.log('[WebRTC] Call rejected by peer');
      setErrorMessage('Call was declined or unanswered.');
      setTimeout(() => {
        onClose();
      }, 2000);
    };

    socket.on('webrtc_call_accepted', handleCallAccepted);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('webrtc_call_ended', handleCallEnded);
    socket.on('webrtc_call_rejected', handleCallRejected);

    // If Outgoing Call: Initialize camera/mic and send offer
    if (!isIncoming && targetUser) {
      initiateOutgoingCall(targetUser.id);
    }

    return () => {
      socket.off('webrtc_call_accepted', handleCallAccepted);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('webrtc_call_ended', handleCallEnded);
      socket.off('webrtc_call_rejected', handleCallRejected);
    };
  }, [isOpen, isIncoming, targetUser]);

  // Start Duration Timer
  const startTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Format Duration seconds to MM:SS
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // 1. Get User Local Media Stream
  const getLocalMedia = async (videoRequired: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: videoRequired ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] Camera/Mic access error, falling back to audio-only:', err.message);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setIsVideoOff(true);
        return audioStream;
      } catch (audioErr) {
        setErrorMessage('Could not access microphone or camera. Please grant browser permissions.');
        return null;
      }
    }
  };

  // 2. Initiate Outgoing Call
  const initiateOutgoingCall = async (targetUserId: string) => {
    const stream = await getLocalMedia(callType === 'video');
    if (!stream) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle Remote Stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.getSocket()?.emit('webrtc_ice_candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Create Offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.getSocket()?.emit('webrtc_call_user', {
        targetUserId,
        signalData: offer,
        callType,
        callerName: user?.name || 'Family Member',
        callerAvatar: user?.avatar,
      });
    } catch (e) {
      console.error('[WebRTC] Failed to create offer', e);
      setErrorMessage('Failed to connect call.');
    }
  };

  // 3. Accept Incoming Call
  const handleAcceptCall = async () => {
    if (!targetUser || !incomingSignal) return;

    setCallStatus('connected');
    startTimer();

    const stream = await getLocalMedia(callType === 'video');
    if (!stream) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle Remote Stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track in answered call');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.getSocket()?.emit('webrtc_ice_candidate', {
          targetUserId: targetUser.id,
          candidate: event.candidate,
        });
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.getSocket()?.emit('webrtc_answer_call', {
        targetUserId: targetUser.id,
        signalData: answer,
      });
    } catch (e) {
      console.error('[WebRTC] Failed to answer call', e);
      setErrorMessage('Failed to establish peer connection.');
    }
  };

  // 4. Decline / End Call
  const handleEndCall = () => {
    if (targetUser) {
      if (callStatus === 'incoming') {
        socketService.getSocket()?.emit('webrtc_reject_call', { targetUserId: targetUser.id });
      } else {
        socketService.getSocket()?.emit('webrtc_end_call', { targetUserId: targetUser.id });
      }
    }
    cleanUpCall();
    onClose();
  };

  // 5. Toggle Audio Mute
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // 6. Toggle Camera On/Off
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // 7. Toggle Speaker / Audio Output
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerMuted;
    }
    setIsSpeakerMuted((prev) => !prev);
  };

  // 7. Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled or failed', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender && videoTrack) {
        videoSender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const cleanUpCall = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setCallDuration(0);
    setIsScreenSharing(false);
  };

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
              <h4 className="text-sm font-bold text-white leading-none">{targetUser?.name || 'Family Call'}</h4>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {callStatus === 'connected'
                  ? formatDuration(callDuration)
                  : callStatus === 'incoming'
                  ? 'Incoming Call...'
                  : 'Calling...'}
              </span>
            </div>
          </div>

          {/* End-to-End Encryption Badge */}
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted (P2P)</span>
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
              callStatus === 'connected' && !isVideoOff ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Audio Wave / Avatar Screen (When Audio-only or Video is Off or Calling) */}
          {(callStatus !== 'connected' || isVideoOff) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 z-10">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-2xl border-4 border-slate-800">
                  {targetUser?.name?.charAt(0) || 'F'}
                </div>
                {callStatus === 'connected' && (
                  <div className="absolute -inset-3 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none opacity-40" />
                )}
                {callStatus === 'calling' && (
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
                  {callStatus === 'connected' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Connected • {formatDuration(callDuration)}</span>
                    </span>
                  ) : callStatus === 'incoming' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...</span>
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
                <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold">
                  {errorMessage}
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
          {callStatus === 'incoming' ? (
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
              {/* Media Toggles: 🎤 Mic, 📹 Video, 🔊 Speaker, 🖥️ Screen Share */}
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* 🎤 Mic Toggle */}
                <button
                  onClick={toggleAudio}
                  className="flex flex-col items-center gap-1 group"
                  title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
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
                  title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
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

                {/* 🖥️ Screen Share Toggle */}
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

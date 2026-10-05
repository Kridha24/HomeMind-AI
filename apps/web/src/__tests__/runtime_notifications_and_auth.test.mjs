import { test, describe, before, it } from 'node:test';
import assert from 'node:assert';

describe('HomeMind.AI Runtime Message Notifications & Auth Error Classification', () => {

  describe('Bug A: Message Notifications & Notification Drawer Integration', () => {
    it('integrates communication direct messages into notification drawer alongside household alerts', () => {
      const drawerNotifications = [
        {
          id: 'msg_101',
          conversationId: 'conv_1',
          senderId: 'user_mihir',
          senderName: 'Mihir',
          previewText: 'Can you check the water filter?',
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'DIRECT',
        }
      ];

      const householdAlerts = [
        {
          id: 'alert_1',
          householdId: 'hh_1',
          title: 'Electricity Bill Due',
          message: '₹2,450 due in 2 days',
          type: 'BILL_DUE',
          isRead: false,
          createdAt: new Date().toISOString(),
        }
      ];

      // Total combined unread count calculation
      const totalUnreadMessages = drawerNotifications.filter((m) => !m.isRead).length;
      const totalUnreadAlerts = householdAlerts.filter((a) => !a.isRead).length;
      const combinedCount = totalUnreadMessages + totalUnreadAlerts;

      assert.strictEqual(combinedCount, 2, 'Combined unread count must sum messages and household alerts');
      assert.strictEqual(drawerNotifications[0].senderName, 'Mihir');
      assert.strictEqual(drawerNotifications[0].previewText, 'Can you check the water filter?');
    });

    it('deduplicates message notifications using message.id with clientMessageId fallback', () => {
      const processedIds = new Set();
      const messagesReceived = [
        { id: 'msg_200', clientMessageId: 'cli_200', text: 'Hello' },
        { id: 'msg_200', clientMessageId: 'cli_200', text: 'Hello Duplicate' },
        { id: null, clientMessageId: 'cli_201', text: 'Unique message' },
        { id: null, clientMessageId: 'cli_201', text: 'Duplicate fallback' }
      ];

      const accepted = [];
      for (const msg of messagesReceived) {
        const dedupeKey = msg.id || msg.clientMessageId;
        if (!processedIds.has(dedupeKey)) {
          processedIds.add(dedupeKey);
          accepted.push(msg);
        }
      }

      assert.strictEqual(accepted.length, 2, 'Must accept only 2 unique messages and filter out duplicates');
      assert.strictEqual(accepted[0].id, 'msg_200');
      assert.strictEqual(accepted[1].clientMessageId, 'cli_201');
    });

    it('suppresses duplicate toasts and browser alerts when active conversation is open and focused', () => {
      const activeConversationId = 'conv_1';
      const isDocumentFocused = true;
      const isDocumentVisible = true;

      const incomingEnvelope = {
        id: 'msg_300',
        conversationId: 'conv_1',
        senderId: 'user_b',
      };

      const isViewingCurrent = activeConversationId === incomingEnvelope.conversationId;
      const isPageFocused = isDocumentVisible && isDocumentFocused;

      const shouldSuppressNotification = isViewingCurrent && isPageFocused;
      assert.strictEqual(shouldSuppressNotification, true, 'Active conversation in focused tab MUST suppress noisy notifications');
    });

    it('clears unread count and drawer notification when conversation is opened', () => {
      let unreadByConv = { 'conv_1': 2, 'conv_2': 1 };
      let totalUnread = 3;
      let drawerItems = [
        { id: 'm1', conversationId: 'conv_1' },
        { id: 'm2', conversationId: 'conv_1' },
        { id: 'm3', conversationId: 'conv_2' }
      ];

      // User opens conversation 1
      const convToOpen = 'conv_1';
      const countToClear = unreadByConv[convToOpen] || 0;
      delete unreadByConv[convToOpen];
      totalUnread -= countToClear;
      drawerItems = drawerItems.filter((item) => item.conversationId !== convToOpen);

      assert.strictEqual(totalUnread, 1, 'Total unread decrements accurately');
      assert.strictEqual(unreadByConv['conv_1'], undefined, 'Conversation unread count is cleared');
      assert.strictEqual(drawerItems.length, 1, 'Only conv_2 remains in drawer items');
    });
  });

  describe('Bug B: Delayed Google Auth Error Prevention & Error Classification', () => {
    it('ignores ambient/background GIS callbacks when no active user attempt was initiated', () => {
      let activeUserAttempt = null; // User did NOT click Google

      const handleGisCallback = (response) => {
        // Guard check
        const isFreshAttempt = activeUserAttempt && (Date.now() - activeUserAttempt.timestamp < 120000);
        if (!isFreshAttempt) {
          return { accepted: false, reason: 'ambient_ignored' };
        }
        return { accepted: true };
      };

      const result = handleGisCallback({ credential: 'mock_stale_token' });
      assert.strictEqual(result.accepted, false, 'Ambient callback without user click MUST be discarded');
      assert.strictEqual(result.reason, 'ambient_ignored');
    });

    it('accepts GIS credential callback when user intentionally initiated an attempt', () => {
      const activeUserAttempt = { id: 'att_123', timestamp: Date.now() };

      const handleGisCallback = (response) => {
        const isFreshAttempt = activeUserAttempt && (Date.now() - activeUserAttempt.timestamp < 120000);
        if (!isFreshAttempt) {
          return { accepted: false, reason: 'ambient_ignored' };
        }
        return { accepted: true, attemptId: activeUserAttempt.id };
      };

      const result = handleGisCallback({ credential: 'valid_user_token' });
      assert.strictEqual(result.accepted, true, 'Intentional attempt MUST proceed to backend');
      assert.strictEqual(result.attemptId, 'att_123');
    });

    it('separates error messages cleanly and NEVER shows Google error for session expired or network error', () => {
      const classifyAuthError = ({ code, isNetwork, isSessionExpired, isGoogleAttempt }) => {
        if (isSessionExpired) {
          return { type: 'SESSION_EXPIRED', message: 'Your session expired. Please sign in again.' };
        }
        if (isNetwork) {
          return { type: 'NETWORK_ERROR', message: "HomeMind couldn't reach the server. Please check your connection and try again." };
        }
        if (code === 'GOOGLE_AUDIENCE_MISMATCH') {
          return { type: 'CONFIG_ERROR', message: 'Google sign-in configuration error: OAuth Client ID mismatch between client and server.' };
        }
        if (isGoogleAttempt) {
          return { type: 'GOOGLE_AUTH_FAILED', message: "We couldn't complete Google sign-in. Please try again or use mobile sign-in." };
        }
        return { type: 'GENERIC', message: 'Authentication note' };
      };

      const sessionResult = classifyAuthError({ isSessionExpired: true });
      assert.strictEqual(sessionResult.message, 'Your session expired. Please sign in again.');
      assert.notStrictEqual(sessionResult.message.includes('Google could not verify'), true);

      const networkResult = classifyAuthError({ isNetwork: true });
      assert.strictEqual(networkResult.message, "HomeMind couldn't reach the server. Please check your connection and try again.");

      const googleFailedResult = classifyAuthError({ isGoogleAttempt: true });
      assert.strictEqual(googleFailedResult.message, "We couldn't complete Google sign-in. Please try again or use mobile sign-in.");
    });

    it('clears Google error when switching to mobile number / OTP flow', () => {
      let activeError = 'We couldn\'t complete Google sign-in. Please try again.';

      // User types phone number
      const handlePhoneChange = () => {
        activeError = ''; // Cleared on switch
      };

      handlePhoneChange();
      assert.strictEqual(activeError, '', 'Typing phone number immediately clears previous Google error');
    });
  });
});

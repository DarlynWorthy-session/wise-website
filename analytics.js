import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js';

const firebaseConfig = window.WISE_FIREBASE_CONFIG || {
  apiKey: '',
  authDomain: '',
  projectId: 'wise-dashboard-661ce',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: ''
};

const hasRequiredConfig = ['apiKey', 'appId', 'measurementId', 'projectId']
  .every((key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim().length > 0);

if (!hasRequiredConfig) {
  console.warn('Firebase Analytics not initialized: missing required WISE_FIREBASE_CONFIG values.');
} else {
  isSupported()
    .then((supported) => {
      if (!supported) return;

      const app = initializeApp(firebaseConfig);
      const analytics = getAnalytics(app);

      const trackEvent = (name, params = {}) => logEvent(analytics, name, params);
      const pagePath = window.location.pathname || '/';

      trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pagePath
      });

      if (pagePath.endsWith('/enroll.html') || pagePath === '/enroll.html') {
        trackEvent('registration_page_view', { page_path: pagePath });
      }

      document.querySelectorAll('a[href*="catalog.html"]').forEach((link) => {
        link.addEventListener('click', () => {
          trackEvent('catalog_view', {
            source_page: pagePath,
            destination: link.href
          });
        });
      });

      document.querySelectorAll('[data-calendly]').forEach((trigger) => {
        trigger.addEventListener('click', () => {
          trackEvent('checkout_started', {
            source_page: pagePath,
            course: trigger.querySelector('.course-card-name')?.textContent?.trim() || 'unknown'
          });
        });
      });

      const query = new URLSearchParams(window.location.search);
      const checkout = (query.get('checkout') || query.get('status') || '').toLowerCase();
      const isCancelled = checkout === 'cancelled' || checkout === 'canceled' || query.get('cancelled') === 'true' || query.get('canceled') === 'true';
      const isSuccess = checkout === 'success' || query.has('session_id');

      if (isCancelled) {
        trackEvent('checkout_cancelled', { page_path: pagePath });
      } else if (isSuccess) {
        trackEvent('checkout_success', { page_path: pagePath });
      }

      window.wiseTrackEvent = trackEvent;
    })
    .catch(() => {
      // Ignore analytics initialization failures to keep the site flow unaffected.
    });
}

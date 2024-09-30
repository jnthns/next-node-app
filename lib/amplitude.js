import { useEffect } from 'react';
import { init, track } from '@amplitude/analytics-node';
import * as sessionReplay from "@amplitude/session-replay-browser";
import { waitForIndexedDB } from '../lib/idb';
import { RudderAnalytics } from "@rudderstack/analytics-js";
require('dotenv').config();

const AMPLITUDE_API_KEY = 'd8d47f31b5c3de8852229cf96b91769d'
// const AMPLITUDE_API_KEY = 'ab46a20bff78e0e81465cdaf05ab4e17'

const rudderanalytics = new RudderAnalytics();
rudderanalytics.load('2mA8kVGW5GdKQ8P9nR2wr0F9rhg', "https://amplitudeyksfv.dataplane.rudderstack.com", {
    useBeacon: true,
    autoTrack: true
});

const rudderAnonymousId = rudderanalytics.getAnonymousId();
const rudderSessionId = rudderanalytics.getSessionId();

const initializeAmplitude = async () => {
    await waitForIndexedDB();

    init(AMPLITUDE_API_KEY, null, {
        flushIntervalMillis: 500,
        flushQueueSize: 1
    }).promise.then(() => {
        window.rudderanalytics.ready(function() {
          sessionReplay.init(AMPLITUDE_API_KEY, {
              deviceId: rudderAnonymousId,
              sessionId: rudderSessionId,
              sampleRate: 1
          }).promise;
     
          // Patch track method to include sessionReplayProperties
          const rudderAnalyticsTrack = rudderanalytics.track;
          rudderanalytics.track = function (eventName, eventProperties, options, callback) {
            const sessionReplayProperties = sessionReplay.getSessionReplayProperties();
            eventProperties = {
              ...eventProperties,
              ...sessionReplayProperties,
            };

            rudderAnalyticsTrack(eventName, eventProperties, options, callback);
          };
     
          // Patch page method to include sessionReplayProperties
          const rudderAnalyticsPage = rudderanalytics.page;
          rudderanalytics.page = function (category, name, properties, options, callback) {
            const sessionReplayProperties = sessionReplay.getSessionReplayProperties();
            properties = {
              ...properties,
              ...sessionReplayProperties,
            };
            rudderAnalyticsPage(category, name, properties, options, callback);
          };

          sessionReplay.setSessionId(rudderSessionId)
        });
    });
};

export const logEvent = async (event, eventProps) => {
    await waitForIndexedDB();
    const sessionReplayProperties = sessionReplay.getSessionReplayProperties();
    const pagePath = window.location.pathname;
    const pageLocation = window.location.href;
    const pageURL = window.location.origin;
    const pageName = document.title;

    eventProps = {
        "page_path": pagePath,
        "page_location": pageLocation,
        "page_name": pageName,
        "URL": pageURL
    }

    await track(event, {
        ...eventProps,
        ...sessionReplayProperties // setting the Session Replay ID
    }, {
        user_id: null,
        device_id: rudderAnonymousId,
        session_id: rudderSessionId,
        country: "US",
        city: "San Francisco",
        region: "Bay Area",
        device_brand: "Apple",
        device_manufacturer: "Apple",
        device_model: "Macbook Pro",
        os_name: "MacOS",
        platform: "Desktop App",
        language: "English",
        version: 1.0
    });
};

/**
 * This transformation intercepts 'identify' events with sessionStart = true
 * and generates an additional 'track' event named "Session Started".
 * 
 * Purpose: To enable Amplitude to interpret when a particular session started,
 * as it cannot directly interpret this from RudderStack's identify event.
 */
export const transformEvent =  (event) => {
    if (event.context && event.context.sessionStart === true) {
      // Create a new track event "Session Started" based on the identify event
      const trackEvent = {
        ...event,              
        type: 'track',         
        event: 'Session Started'
      };
      return [event, trackEvent];
    }
    return event;
  }

const Amplitude = () => {
    useEffect(() => {
        initializeAmplitude();
    }, []);

    return null;
};

export { rudderanalytics };
export default Amplitude;

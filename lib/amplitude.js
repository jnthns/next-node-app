import { useEffect } from 'react';
import { init, track } from '@amplitude/analytics-node';
import { v4 as uuidv4 } from 'uuid';
import * as sessionReplay from "@amplitude/session-replay-browser";
import { waitForIndexedDB } from '../lib/idb';
import { RudderAnalytics } from "@rudderstack/analytics-js";
require('dotenv').config();

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
// const AMPLITUDE_API_KEY = 'ab46a20bff78e0e81465cdaf05ab4e17'

export const uuid = uuidv4();
const sessionId = Date.now();

console.log("Device ID is: " + uuid);
console.log("Session ID is: " + sessionId);

const rudderanalytics = new RudderAnalytics();
rudderanalytics.load('2mA8kVGW5GdKQ8P9nR2wr0F9rhg', "https://amplitudeyksfv.dataplane.rudderstack.com", {});

const initializeAmplitude = async () => {
    await waitForIndexedDB();

    init(AMPLITUDE_API_KEY, null, {
        flushIntervalMillis: 500,
        flushQueueSize: 1
    }).promise.then(() => {
        window.rudderanalytics.ready(function() {
          const rudderAnonymousId = rudderanalytics.getAnonymousId();
  
          sessionReplay.init(AMPLITUDE_API_KEY, {
              deviceId: rudderAnonymousId,
              sessionId: rudderanalytics.getSessionId(),
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

          sessionReplay.setSessionId(rudderanalytics.getSessionId())
        });
    });
};

export const logEvent = async (event, eventProps) => {
    await waitForIndexedDB();
    const sessionReplayProperties = sessionReplay.getSessionReplayProperties();
    console.log("getSessionReplayProperties: " + sessionReplayProperties)
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
        device_id: uuid,
        session_id: sessionId,
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

const Amplitude = () => {
    useEffect(() => {
        initializeAmplitude();
    }, []);

    return null;
};

export { rudderanalytics };
export default Amplitude;

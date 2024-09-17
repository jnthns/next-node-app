import * as sessionReplay from "@amplitude/session-replay-browser";

amplitude.init('AMPLITUDE_API_KEY', rudderanalytics.userId || null, {
    onInit: function (amplitude) {
      window.rudderanalytics.ready(function() {
        const rudderAnonymousId = rudderanalytics.getAnonymousId();

        sessionReplay.init("AMPLITUDE_API_KEY", {
            deviceId: rudderAnonymousId,
            sessionId: rudderanalytics.getSessionId(),
            sampleRate: .10
        }).promise;

        sessionReplay.setSessionId(rudderanalytics.getSessionId())
   
        // Patch track method to include sessionReplayProperties
        const originalTrack = rudderanalytics.track;
        rudderanalytics.track = function (eventName, eventProperties, options, callback) {
          const sessionReplayProperties = amplitude.getSessionReplayProperties();
          eventProperties = {
            ...eventProperties,
            ...sessionReplayProperties,
          };
          originalTrack(eventName, eventProperties, options, callback);
        };
   
        // Patch page method to include sessionReplayProperties
        const originalPage = rudderanalytics.page;
        rudderanalytics.page = function (category, name, properties, options, callback) {
          const sessionReplayProperties = amplitude.getSessionReplayProperties();
          properties = {
            ...properties,
            ...sessionReplayProperties,
          };
          originalPage(category, name, properties, options, callback);
        };
      });
    }
  });
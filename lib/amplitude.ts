import { init, track, identify, Identify, Revenue } from '@amplitude/analytics-node';
import { v4 as uuidv4 } from 'uuid';
// Session Replay 
import * as sessionReplay from "@amplitude/session-replay-browser";

// Enter your API key here
const AMPLITUDE_API_KEY = 'd8d47f31b5c3de8852229cf96b91769d'
const uuid = uuidv4();
const sessionId = Date.now()

console.log("Device ID is: " + uuid)
console.log("Session ID is: " + sessionId)

// Initialize Amplitude
export const amplitudeClient = async () => {
    init(AMPLITUDE_API_KEY, {
        flushIntervalMillis: 500,
        flushQueueSize: 1
    });

    // Configure the Session Replay SDK and begin collecting replays
    await sessionReplay.init(AMPLITUDE_API_KEY, {
        deviceId: uuid,
        sessionId: sessionId,
    //   optOut: "<boolean>",
        sampleRate: 100
    }).promise;
}

// Call whenever the session id changes
sessionReplay.setSessionId(sessionId);

// When you send events to Amplitude, call this event to get
// the most up to date session replay properties for the event
const sessionReplayProperties = sessionReplay.getSessionReplayProperties();

// Log an event
export const logEvent = async (event: string, eventProps: object) => {
    await track(event, {
      ...eventProps,
      ...sessionReplayProperties
    },
    {
        user_id: uuid,
        device_id: uuid,
        session_id: sessionId
    });
  };  


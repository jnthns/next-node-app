import { useEffect } from 'react';
import { uuid } from './amplitude.js'
import { Experiment } from '@amplitude/experiment-node-server';

const DEPLOYMENT_KEY = process.env.NEXT_PUBLIC_DEPLOYMENT_KEY;

const experiment = Experiment.initializeRemote(DEPLOYMENT_KEY, {
    fetchTimeoutMillis: 500,
    fetchRetries: 1,
    fetchRetryBackoffMinMillis: 0,
    fetchRetryTimeoutMillis: 500,
});

const user = {
    user_id: 'next node app',
    device_id: uuid,
    user_properties: {
        'premium': true,
    },
};

const flagKey = 'test';

const AmplitudeExperiment = ({ setVariantText }) => {
  useEffect(() => {
    const getVariant = async () => {
      const variants = await experiment.fetchV2(user);
      const variant = variants[flagKey];
      if (variant?.value === 'control') {
        console.log("Variant is CONTROL");
        setVariantText("Variant is CONTROL");
      } else if (variant?.value == undefined) {
        setVariantText("Experiment is deactivated");
      } else {
        console.log("Variant is " + variant?.value);
        setVariantText("Variant is " + variant?.value);
      }
    };

    getVariant(); 
  }, [setVariantText]);

  return null; 
};

export default AmplitudeExperiment;

import { verifyDataIntegrity } from './lib/verification-engine';

async function debug() {
  const dataId = '69bc26b419921729d945be9e';
  try {
    console.log(`Starting debug verification for ID: ${dataId}`);
    const result = await verifyDataIntegrity(dataId);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('CAUGHT ERROR:', error);
  }
}

debug();

#!/usr/bin/env node
const crypto = require('crypto');

// The token ID and signature from your example
const id = 'ktd-2025-08-24-019';
const providedSig = '94812870904d91fe7819333a71cf90670d64e58c672420d902fd352530cc3651';

// Test with two different secrets
const devSecret = 'development-signing-secret-0123456789abcdef';
const testSecret = 'test'; // Example of another possible secret

// Generate signatures with both secrets
const devSignature = crypto.createHmac('sha256', devSecret).update(id).digest('hex');
const testSignature = crypto.createHmac('sha256', testSecret).update(id).digest('hex');

console.log('Token ID:', id);
console.log('Provided Signature:', providedSig);
console.log('\nDevelopment Secret Test:');
console.log('Generated Signature:', devSignature);
console.log('Matches Provided:', devSignature === providedSig);

console.log('\nTest Secret Test:');
console.log('Generated Signature:', testSignature);
console.log('Matches Provided:', testSignature === providedSig);

// Try to find what secret was used to generate the provided signature
// This is just a simple test with some common strings
const possibleSecrets = [
  'development-signing-secret-0123456789abcdef',
  'test',
  'development-signing-secret',
  'production-signing-secret',
  'secret',
  'your-secret-here'
];

console.log('\nTrying to find the matching secret:');
possibleSecrets.forEach(secret => {
  const sig = crypto.createHmac('sha256', secret).update(id).digest('hex');
  const matches = sig === providedSig;
  console.log(`- Secret "${secret.slice(0, 10)}...": ${matches ? 'MATCHES!' : 'No match'}`);
});

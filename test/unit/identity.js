/**
 * Copyright 2016-2017 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const tape = require('tape');
const _test = require('tape-promise').default;
const test = _test(tape);

const testutil = require('./util.js');
const utils = require('fabric-client/lib/utils.js');
const api = require('fabric-client/lib/api.js');

const jsrsa = require('jsrsasign');
const KEYUTIL = jsrsa.KEYUTIL;
const idModule = require('fabric-client/lib/msp/identity.js');
const Identity = idModule.Identity;
const Signer = idModule.Signer;
const SigningIdentity = idModule.SigningIdentity;
const MSP = require('fabric-client/lib/msp/msp.js');
const ecdsaKey = require('fabric-client/lib/impl/ecdsa/key.js');

const TEST_MSG = 'this is a test message';

const TEST_CERT_PEM = '-----BEGIN CERTIFICATE-----' +
'MIIDVDCCAvqgAwIBAgIBATAKBggqhkjOPQQDAjBOMRMwEQYDVQQKDArOoyBBY21l' +
'IENvMRkwFwYDVQQDExB0ZXN0LmV4YW1wbGUuY29tMQ8wDQYDVQQqEwZHb3BoZXIx' +
'CzAJBgNVBAYTAk5MMB4XDTE2MTIxNjIzMTAxM1oXDTE2MTIxNzAxMTAxM1owTjET' +
'MBEGA1UECgwKzqMgQWNtZSBDbzEZMBcGA1UEAxMQdGVzdC5leGFtcGxlLmNvbTEP' +
'MA0GA1UEKhMGR29waGVyMQswCQYDVQQGEwJOTDBZMBMGByqGSM49AgEGCCqGSM49' +
'AwEHA0IABFKnXh7hBdp6s9OJ/aadigT1z2WzBbSc7Hzb3rkaWFz4e+9alqqWg9lr' +
'ur/mDYzG9dudC8jFjVa7KIh+2BxgBayjggHHMIIBwzAOBgNVHQ8BAf8EBAMCAgQw' +
'JgYDVR0lBB8wHQYIKwYBBQUHAwIGCCsGAQUFBwMBBgIqAwYDgQsBMA8GA1UdEwEB' +
'/wQFMAMBAf8wDQYDVR0OBAYEBAECAwQwDwYDVR0jBAgwBoAEAQIDBDBiBggrBgEF' +
'BQcBAQRWMFQwJgYIKwYBBQUHMAGGGmh0dHA6Ly9vY0JDQ1NQLmV4YW1wbGUuY29t' +
'MCoGCCsGAQUFBzAChh5odHRwOi8vY3J0LmV4YW1wbGUuY29tL2NhMS5jcnQwRgYD' +
'VR0RBD8wPYIQdGVzdC5leGFtcGxlLmNvbYERZ29waGVyQGdvbGFuZy5vcmeHBH8A' +
'AAGHECABSGAAACABAAAAAAAAAGgwDwYDVR0gBAgwBjAEBgIqAzAqBgNVHR4EIzAh' +
'oB8wDoIMLmV4YW1wbGUuY29tMA2CC2V4YW1wbGUuY29tMFcGA1UdHwRQME4wJaAj' +
'oCGGH2h0dHA6Ly9jcmwxLmV4YW1wbGUuY29tL2NhMS5jcmwwJaAjoCGGH2h0dHA6' +
'Ly9jcmwyLmV4YW1wbGUuY29tL2NhMS5jcmwwFgYDKgMEBA9leHRyYSBleHRlbnNp' +
'b24wCgYIKoZIzj0EAwIDSAAwRQIgcguBb6FUxO+X8DbY17gpqSGuNC4NT4BddPg1' +
'UWUxIC0CIQDNyHQAwzhw+512meXRwG92GfpzSBssDKLdwlrqiHOu5A==' +
'-----END CERTIFICATE-----';

const TEST_KEY_PRIVATE_PEM = '-----BEGIN PRIVATE KEY-----' +
'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgZYMvf3w5VkzzsTQY' +
'I8Z8IXuGFZmmfjIX2YSScqCvAkihRANCAAS6BhFgW/q0PzrkwT5RlWTt41VgXLgu' +
'Pv6QKvGsW7SqK6TkcCfxsWoSjy6/r1SzzTMni3J8iQRoJ3roPmoxPLK4' +
'-----END PRIVATE KEY-----';
const TEST_KEY_PRIVATE_CERT_PEM = '-----BEGIN CERTIFICATE-----' +
'MIICEDCCAbagAwIBAgIUXoY6X7jIpHAAgL267xHEpVr6NSgwCgYIKoZIzj0EAwIw' +
'fzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh' +
'biBGcmFuY2lzY28xHzAdBgNVBAoTFkludGVybmV0IFdpZGdldHMsIEluYy4xDDAK' +
'BgNVBAsTA1dXVzEUMBIGA1UEAxMLZXhhbXBsZS5jb20wHhcNMTcwMTAzMDEyNDAw' +
'WhcNMTgwMTAzMDEyNDAwWjAQMQ4wDAYDVQQDEwVhZG1pbjBZMBMGByqGSM49AgEG' +
'CCqGSM49AwEHA0IABLoGEWBb+rQ/OuTBPlGVZO3jVWBcuC4+/pAq8axbtKorpORw' +
'J/GxahKPLr+vVLPNMyeLcnyJBGgneug+ajE8srijfzB9MA4GA1UdDwEB/wQEAwIF' +
'oDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDAYDVR0TAQH/BAIwADAd' +
'BgNVHQ4EFgQU9BUt7QfgDXx9g6zpzCyJGxXsNM0wHwYDVR0jBBgwFoAUF2dCPaqe' +
'gj/ExR2fW8OZ0bWcSBAwCgYIKoZIzj0EAwIDSAAwRQIgcWQbMzluyZsmvQCvGzPg' +
'f5B7ECxK0kdmXPXIEBiizYACIQD2x39Q4oVwO5uL6m3AVNI98C2LZWa0g2iea8wk' +
'BAHpeA==' +
'-----END CERTIFICATE-----';

test('\n\n ** Identity class tests **\n\n', (t) => {
	testutil.resetDefaults();

	t.throws(
		() => {
			new Identity();
		},
		/Missing required parameter "certificate"/,
		'Checking required input parameters'
	);

	t.throws(
		() => {
			new Identity('cert', 'pubKey');
		},
		/Missing required parameter "mspId"/,
		'Checking required input parameters'
	);

	t.throws(
		() => {
			new MSP();
		},
		/Missing required parameter "config"/,
		'Checking required config parameter for MSP constructor'
	);

	t.throws(
		() => {
			new MSP({admins: [], cryptoSuite: 'blah'});
		},
		/Parameter "config" missing required field "id"/,
		'Checking required config parameter "id" for MSP constructor'
	);

	t.throws(
		() => {
			new MSP({admins: [], id: 'blah'});
		},
		/Parameter "config" missing required field "cryptoSuite"/,
		'Checking required config parameter "cryptoSuite" for MSP constructor'
	);

	t.throws(
		() => {
			new MSP({signer: 'blah', id: 'blah', cryptoSuite: 'blah'});
		},
		/Error: Parameter "signer" must be an instance of SigningIdentity/,
		'Checking required config parameter "admins" for MSP constructor'
	);

	t.throws(
		() => {
			new Signer();
		},
		/Missing required parameter "cryptoSuite"/,
		'Checking required parameter "cryptoSuite"'
	);

	t.throws(
		() => {
			new Signer('blah');
		},
		/Missing required parameter "key" for private key/,
		'Checking required parameter "key"'
	);

	t.throws(
		() => {
			new SigningIdentity();
		},
		/Missing required parameter "certificate"/,
		'Checking required input parameters'
	);

	t.throws(
		() => {
			new SigningIdentity('cert');
		},
		/Missing required parameter "publicKey"/,
		'Checking required input parameters'
	);

	t.throws(
		() => {
			new SigningIdentity('cert', 'pubKey');
		},
		/Missing required parameter "mspId"/,
		'Checking required input parameters'
	);

	t.throws(
		() => {
			new SigningIdentity('cert', 'pubKey', 'mspId', 'cryptoSuite');
		},
		/Missing required parameter "signer"/,
		'Checking required input parameters'
	);

	const cryptoUtils = utils.newCryptoSuite();
	cryptoUtils.setCryptoKeyStore(utils.newCryptoKeyStore());

	// test identity serialization and deserialization
	const mspImpl = new MSP({
		rootCerts: [],
		admins: [],
		id: 'testMSP',
		cryptoSuite: cryptoUtils
	});

	let pubKey = cryptoUtils.importKey(TEST_CERT_PEM, {algorithm: api.CryptoAlgorithms.X509Certificate});
	const identity = new Identity(TEST_CERT_PEM, pubKey, mspImpl.getId(), cryptoUtils);

	const serializedID = identity.serialize();
	// deserializeIdentity should work both ways ... with promise and without
	const identity_g = mspImpl.deserializeIdentity(serializedID, false);
	t.equals(identity_g.getMSPId(), 'testMSP', 'deserializeIdentity call without promise');

	mspImpl.deserializeIdentity(serializedID)
		.then((dsID) => {
			t.equal(dsID._certificate, TEST_CERT_PEM, 'Identity class function tests: deserialized certificate');
			t.equal(dsID._publicKey.isPrivate(), false, 'Identity class function tests: deserialized public key');
			t.equal(dsID._publicKey._key.pubKeyHex, '0452a75e1ee105da7ab3d389fda69d8a04f5cf65b305b49cec7cdbdeb91a585cf87bef5a96aa9683d96bbabfe60d8cc6f5db9d0bc8c58d56bb28887ed81c6005ac', 'Identity class function tests: deserialized public key ecparam check');

			// manually construct a key based on the saved privKeyHex and pubKeyHex
			const f = KEYUTIL.getKey(TEST_KEY_PRIVATE_PEM);
			const testKey = new ecdsaKey(f);
			pubKey = testKey.getPublicKey();

			const signer = new Signer(cryptoUtils, testKey);
			t.equal(signer.getPublicKey().isPrivate(), false, 'Test Signer class getPublicKey() method');

			const signingID = new SigningIdentity(TEST_KEY_PRIVATE_CERT_PEM, pubKey, mspImpl.getId(), cryptoUtils, signer);

			t.throws(
				() => {
					signingID.sign(TEST_MSG, {hashFunction: 'not_a_function'});
				},
				/The "hashFunction" field must be a function/,
				'Test invalid hashFunction parameter for the sign() method'
			);

			const sig = signingID.sign(TEST_MSG);
			t.equal(cryptoUtils.verify(pubKey, sig, TEST_MSG), true, 'Test SigningIdentity sign() method');
			t.equal(signingID.verify(TEST_MSG, sig), true, 'Test Identity verify() method');
			t.end();
		}).catch((err) => {
			t.fail(err.stack ? err.stack : err);
			t.end();
		});
});

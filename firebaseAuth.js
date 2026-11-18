const jwt = require("jsonwebtoken");

require('dotenv').config();

//[SECTION] Firebase ID token verification
/*
    Firebase signs ID tokens with Google's public keys. We check the token ourselves with jsonwebtoken
    (no service account needed), following https://firebase.google.com/docs/auth/admin/verify-id-tokens
    - signed with one of Google's keys (RS256)
    - audience is our Firebase project ID, issuer is securetoken.google.com/<projectId>
    - not expired
*/
const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// Keys are cached until Google's Cache-Control max-age runs out
let cachedCerts = null;
let certsExpireAt = 0;

const getCerts = () => {
    if(cachedCerts && Date.now() < certsExpireAt) {
        return Promise.resolve(cachedCerts);
    }

    return fetch(CERTS_URL)
    .then(res => {
        let maxAge = /max-age=(\d+)/.exec(res.headers.get("cache-control") || "");
        certsExpireAt = Date.now() + (maxAge ? Number(maxAge[1]) * 1000 : 3600000);
        return res.json();
    })
    .then(certs => {
        cachedCerts = certs;
        return certs;
    });
};

module.exports.verifyFirebaseToken = (idToken) => {

    let projectId = process.env.FIREBASE_PROJECT_ID;

    if(!projectId) {
        return Promise.reject(new Error("Google sign-in is not configured"));
    }

    let decoded = jwt.decode(idToken || "", { complete: true });

    if(!decoded || !decoded.header.kid) {
        return Promise.reject(new Error("Invalid Google sign-in token"));
    }

    return getCerts()
    .then(certs => {
        let cert = certs[decoded.header.kid];

        if(!cert) {
            throw new Error("Invalid Google sign-in token");
        }

        // Throws if the signature, audience, issuer or expiry is wrong
        let payload = jwt.verify(idToken, cert, {
            algorithms: ["RS256"],
            audience: projectId,
            issuer: `https://securetoken.google.com/${ projectId }`
        });

        if(!payload.sub) {
            throw new Error("Invalid Google sign-in token");
        }

        return payload;
    });
};

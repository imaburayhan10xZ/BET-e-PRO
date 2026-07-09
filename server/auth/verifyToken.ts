import { getFirebaseConfig } from './firebase';

export interface VerifiedTokenUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoUrl?: string;
}

/**
 * Verifies a Firebase ID Token using Google's secure Firebase Authentication REST API.
 * This is 100% serverless-safe, cold-start compatible, and does not require complex firebase-admin setups.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedTokenUser> {
  if (!idToken) {
    throw new Error('No ID token provided');
  }

  const config = getFirebaseConfig();
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error('Firebase API key is not configured');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {}

      const msg = parsedError.error?.message || 'Token verification failed';
      console.error('[AUTH-VERIFY] Google API returned non-ok status:', response.status, errorText);
      throw new Error(`Firebase Auth: ${msg}`);
    }

    const data: any = await response.json();
    if (!data.users || data.users.length === 0) {
      throw new Error('User not found in Firebase Auth response');
    }

    const fbUser = data.users[0];
    return {
      uid: fbUser.localId,
      email: fbUser.email,
      emailVerified: fbUser.emailVerified || false,
      displayName: fbUser.displayName,
      photoUrl: fbUser.photoUrl,
    };
  } catch (err: any) {
    console.error('[AUTH-VERIFY] Error verifying Firebase ID token:', err);
    throw new Error(err.message || 'ID Token verification failed');
  }
}

import { getApps, initializeApp } from 'firebase-admin/app'
import { getDataConnect } from 'firebase-admin/data-connect'
import { connectorConfig } from '@wardro/dataconnect-admin'

/**
 * Firebase Admin is configured from Application Default Credentials. On
 * App Hosting those come from the runtime service account; locally you can
 * point at the emulator or run `gcloud auth application-default login`.
 */
if (getApps().length === 0) {
    initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'wardo-ce8d5',
        storageBucket:
            process.env.FIREBASE_STORAGE_BUCKET ||
            'wardo-ce8d5.firebasestorage.app',
    })
}

export const dataConnect = getDataConnect(connectorConfig)

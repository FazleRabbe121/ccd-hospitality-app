import { getCachedDriveToken } from './firebase';
import { AppStateData } from '../types';

const BACKUP_FILENAME = 'ccd_backup_a_better_you.json';

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export async function findDriveBackupFile(token?: string): Promise<DriveFile | null> {
  const authToken = token || getCachedDriveToken();
  if (!authToken) {
    throw new Error('Google Drive access token is not available. Please sign in with Google or connect Drive.');
  }

  const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Google Drive query failed (${response.status})`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

export async function uploadBackupToDrive(
  appData: AppStateData,
  token?: string
): Promise<{ success: boolean; fileId: string; modifiedTime: string }> {
  const authToken = token || getCachedDriveToken();
  if (!authToken) {
    throw new Error('Google Drive access token is not available. Please sign in with Google.');
  }

  const existingFile = await findDriveBackupFile(authToken);
  const fileContent = JSON.stringify(
    {
      app: 'CCD — A Better You Every Day',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: appData,
    },
    null,
    2
  );

  const blob = new Blob([fileContent], { type: 'application/json' });

  if (existingFile) {
    // Update existing file
    const uploadRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: blob,
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Failed to update backup file in Google Drive (${uploadRes.status})`);
    }

    const updatedData = await uploadRes.json();
    return {
      success: true,
      fileId: updatedData.id || existingFile.id,
      modifiedTime: new Date().toISOString(),
    };
  } else {
    // Create new file with multipart upload
    const metadata = {
      name: BACKUP_FILENAME,
      mimeType: 'application/json',
      description: 'CCD — A Better You Every Day Cloud Backup',
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', blob);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: form,
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload backup to Google Drive (${uploadRes.status})`);
    }

    const createdData = await uploadRes.json();
    return {
      success: true,
      fileId: createdData.id,
      modifiedTime: new Date().toISOString(),
    };
  }
}

export async function downloadBackupFromDrive(token?: string): Promise<AppStateData> {
  const authToken = token || getCachedDriveToken();
  if (!authToken) {
    throw new Error('Google Drive access token is not available.');
  }

  const existingFile = await findDriveBackupFile(authToken);
  if (!existingFile) {
    throw new Error('No backup file found in Google Drive yet.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download backup file from Google Drive (${response.status})`);
  }

  const content = await response.json();
  const rawData = content.data || content;
  return rawData as AppStateData;
}

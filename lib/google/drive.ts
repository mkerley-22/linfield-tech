import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function getDriveClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function getCalendarClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  )
  
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

export async function getOrRefreshToken(userId: string = 'default') {
  const auth = await prisma.googleAuth.findUnique({
    where: { userId },
  })
  
  if (!auth) {
    throw new Error('No Google authentication found. Please connect your Google account.')
  }
  
  // Check if token is expired
  if (auth.tokenExpiry && new Date() >= auth.tokenExpiry) {
    if (!auth.refreshToken) {
      throw new Error('Token expired and no refresh token available. Please reconnect.')
    }
    
    const credentials = await refreshAccessToken(auth.refreshToken)
    
    // Update stored token
    await prisma.googleAuth.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || auth.refreshToken,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000),
      },
    })
    
    return credentials.access_token!
  }
  
  return auth.accessToken
}

export async function listDriveFiles(folderId: string, accessToken: string) {
  const drive = await getDriveClient(accessToken)
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime, createdTime)',
    orderBy: 'modifiedTime desc',
  })
  
  return response.data.files || []
}

export async function getDriveFile(fileId: string, accessToken: string) {
  const drive = await getDriveClient(accessToken)
  
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime, createdTime',
  })
  
  return response.data
}

export async function createDriveFolder(name: string, parentId: string | null, accessToken: string) {
  const drive = await getDriveClient(accessToken)
  
  const fileMetadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  
  if (parentId) {
    fileMetadata.parents = [parentId]
  }
  
  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name',
  })
  
  return response.data
}



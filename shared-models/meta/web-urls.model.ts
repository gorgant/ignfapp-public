export enum WebDomains {
  IGNFLP = 'ignytefit.com',
  IGNFAPP_EMAIL = 'ignytefit.com',
  IGNFAPP_PUBLIC = 'app.ignytefit.com',
  IGNFAPP_ADMIN = 'admin.ignytefit.com'
}

export const WebSiteUrls = {
  IGNFLP: `https://${WebDomains.IGNFLP}`,
  IGNFAPP_HOME: `https://${WebDomains.IGNFAPP_PUBLIC}`,
  IGNFAPP_SIGNUP: `https://${WebDomains.IGNFAPP_PUBLIC}/signup`,
  IGNFAPP_LOGIN: `https://${WebDomains.IGNFAPP_PUBLIC}/login`,
  IGNFAPP_ADMIN: `https://${WebDomains.IGNFAPP_ADMIN}`
}
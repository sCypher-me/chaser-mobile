import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.gcdc.meta', appName: 'Chaser Mobile', webDir: 'dist',
  server: { androidScheme: 'https' }, android: { backgroundColor: '#090d18' }
}
export default config

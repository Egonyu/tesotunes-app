import { Platform } from 'react-native';

export type RuntimePlatform = 'ios' | 'android' | 'web';

export function getRuntimePlatform(): RuntimePlatform {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
}

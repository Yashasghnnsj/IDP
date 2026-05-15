import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const wp = (percent: number) => {
  return (width * percent) / 100;
};

export const hp = (percent: number) => {
  return (height * percent) / 100;
};

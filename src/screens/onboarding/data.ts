import React from 'react';
import { Image } from 'react-native';

export const onboardData = [
  {
    image: <Image source={require('../../assets/images/onboard1.png')} style={{ width: 280, height: 280 }} />,
    title: 'AI Cough Analysis',
    description: 'Detect respiratory conditions with a simple cough recording.',
  },
  {
    image: <Image source={require('../../assets/images/onboard2.png')} style={{ width: 280, height: 280 }} />,
    title: 'Offline & Instant',
    description: 'No internet needed. Get results in seconds.',
  },
  {
    image: <Image source={require('../../assets/images/onboard3.png')} style={{ width: 280, height: 280 }} />,
    title: 'Your Health, Secured',
    description: 'Your data stays encrypted on device.',
  },
];
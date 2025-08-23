import localFont from 'next/font/local';

export const openRunde = localFont({
  src: [
    {
      path: './OpenRunde-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './OpenRunde-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './OpenRunde-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './OpenRunde-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
});

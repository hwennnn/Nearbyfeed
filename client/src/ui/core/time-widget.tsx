import * as React from 'react';
import { useEffect, useState } from 'react';

import type { ITextProps } from '@/ui/core/text';
import { Text } from '@/ui/core/text';
import { timeUtils } from '@/utils/time-utils';

export interface TimeWidgetProps extends ITextProps {
  time: Date;
}

export const TimeWidget = ({ time, ...props }: TimeWidgetProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update the time every 5000ms
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures the effect runs only once on mount

  return (
    <Text {...props}>
      {timeUtils.formatCreatedTime(new Date(time), currentTime)}
    </Text>
  );
};

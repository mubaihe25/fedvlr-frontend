import React from 'react';
import { PageType } from '../../types/common';
import { Configuration } from './Configuration';
import { Monitoring } from './Monitoring';
import { Analysis } from './Analysis';
import { Comparison } from './Comparison';
import { History } from './History';

interface ConsoleProps {
  currentPage: PageType;
}

export const Console: React.FC<ConsoleProps> = ({ currentPage }) => {
  switch (currentPage) {
    case 'console':
      return <Configuration />;
    case 'monitoring':
      return <Monitoring />;
    case 'analysis':
      return <Analysis />;
    case 'comparison':
      return <Comparison />;
    case 'history':
      return <History />;
    default:
      return <Configuration />;
  }
};

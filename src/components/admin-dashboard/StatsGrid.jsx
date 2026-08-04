import React from 'react';
import StatCard from './StatCard';
import './AdminNeonGlow.css';

const StatsGrid = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-[80rem] grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={`stats-skeleton-${index}`}
            className="admin-dashboard-skeleton h-[118px] w-full animate-pulse rounded-[1rem] sm:h-[138px]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[80rem] grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export default StatsGrid;

import React from 'react';

interface BorderMagicProps {
  // You can define any props needed here
  title: string;
}

const BorderMagic = ({ title }: BorderMagicProps) => {


  return (
    <button className="relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-black dark:text-white backdrop-blur-3xl">
        {title}
      </span>
    </button>
  );
};

export default BorderMagic;
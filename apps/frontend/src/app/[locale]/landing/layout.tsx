import React from "react";

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout = ({ children }: LandingLayoutProps) => {
  return <div className="min-h-screen">{children}</div>;
};

export default LandingLayout;

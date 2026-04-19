interface LayoutProps {
  children: React.ReactNode;
}

export default function CachedRoutesLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

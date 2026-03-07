interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-text-primary font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-text-muted text-sm mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

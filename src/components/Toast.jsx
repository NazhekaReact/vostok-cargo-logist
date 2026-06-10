import { CheckCircle } from 'lucide-react';

export default function Toast({ message, visible }) {
  if (!visible || !message) return null;

  return (
    <div className="toast">
      <CheckCircle size={18} color="#4ade80" />
      {message}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function Toast({ message, visible }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, message]);

  if (!show) return null;

  return (
    <div className="toast">
      <CheckCircle size={18} color="#4ade80" />
      {message}
    </div>
  );
}

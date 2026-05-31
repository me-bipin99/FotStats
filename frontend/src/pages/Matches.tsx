import { useEffect, useState } from 'react';

export default function Matches() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch matches
    setLoading(false);
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Matches</h1>
      {/* TODO: Add matches list and predictions */}
    </div>
  );
}

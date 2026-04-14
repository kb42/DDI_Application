import { useState, type FormEvent } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const SearchInput = ({ onSearch, isLoading = false }: SearchInputProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Drug Interaction Explorer
        </h1>
        <p className="text-slate-600">
          Ask questions in natural language about drug interactions and treatments
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What interacts with Warfarin?"
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchInput;

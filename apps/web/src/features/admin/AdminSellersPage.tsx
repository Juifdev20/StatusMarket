import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import type { Profile } from '../../types';

export function AdminSellersPage() {
  const { t, i18n } = useTranslation();
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAdminSellers();
        setSellers(res || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = sellers.filter((s) =>
    (s.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">{t('adminNav.sellers')}</h1>
        <span className="badge bg-brume/20 text-brume">{t('adminSellers.count', { count: sellers.length })}</span>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search') + '...'} className="input pl-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brume/20 text-left text-brume">
                <th className="p-4 font-medium">{t('account.name')}</th>
                <th className="p-4 font-medium">{t('account.phoneLabel')}</th>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">{t('adminSellers.createdOn')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-brume/10 last:border-0">
                  <td className="p-4 font-medium">{s.full_name || '—'}</td>
                  <td className="p-4">{s.phone || '—'}</td>
                  <td className="p-4 font-mono text-xs">{s.id.slice(0, 8)}...</td>
                  <td className="p-4 text-brume">{new Date(s.created_at).toLocaleDateString(i18n.language.startsWith('en') ? 'en-US' : 'fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-brume">
            <Users size={32} className="mx-auto mb-2" />
            {t('adminSellers.none')}
          </div>
        )}
      </div>
    </div>
  );
}

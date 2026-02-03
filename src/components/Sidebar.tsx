'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import styles from './Sidebar.module.css';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tenants', label: 'Clientes', icon: Building2 },
  { path: '/modules', label: 'Módulos', icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <span>G</span>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>Grayskull</span>
          <span className={styles.logoTag}>Admin</span>
        </div>
      </div>

      {/* User Card */}
      <div className={styles.userCard}>
        <div className={styles.userAvatar}>
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.name || 'Administrador'}</span>
          <span className={styles.userRole}>Super Admin</span>
        </div>
        <ChevronRight size={16} className={styles.userChevron} />
      </div>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.navLabel}>Principal</span>
          <ul className={styles.navList}>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  >
                    <div className={styles.navItemIcon}>
                      <item.icon size={20} />
                    </div>
                    <span className={styles.navItemLabel}>{item.label}</span>
                    {isActive && <div className={styles.activeIndicator} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

      </nav>

      {/* Logout */}
      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={20} />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}

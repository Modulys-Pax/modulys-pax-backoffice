'use client';

import { Search, Bell, Sun, Moon, ChevronDown, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.right}>
        {/* Search */}
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className={styles.searchInput}
          />
        </div>

        {/* Date */}
        <div className={styles.dateBox}>
          <Calendar size={16} />
          <span>{today}</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Theme Toggle */}
          <button 
            className={styles.iconBtn}
            onClick={toggleTheme}
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <button className={styles.iconBtn} title="Notificações">
            <Bell size={20} />
          </button>
        </div>

        {/* User Menu */}
        <div className={styles.userMenu}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'Admin'}</span>
            <span className={styles.userRole}>Super Admin</span>
          </div>
          <ChevronDown size={16} className={styles.userChevron} />
        </div>
      </div>
    </header>
  );
}

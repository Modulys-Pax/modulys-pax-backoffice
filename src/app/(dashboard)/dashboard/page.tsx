'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  MoreHorizontal,
  Plus,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { tenantsService, plansService } from '@/lib/api';
import { GrowthChart, RevenueChart } from './Charts';
import styles from './page.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    revenue: 0,
  });
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantsData, statsData] = await Promise.all([
        tenantsService.findAll().catch(() => []),
        tenantsService.getStatistics().catch(() => ({ total: 0, active: 0, trial: 0, suspended: 0 })),
      ]);

      setTenants(tenantsData);
      const active = statsData.active || 0;
      setStats({
        totalTenants: statsData.total || tenantsData.length || 0,
        activeTenants: active,
        trialTenants: statsData.trial || 0,
        revenue: active * 299.90,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Clientes',
      value: stats.totalTenants,
      icon: Building2,
      gradient: 'purple',
    },
    {
      title: 'Clientes Ativos',
      value: stats.activeTenants,
      icon: Users,
      gradient: 'green',
    },
    {
      title: 'Em Trial',
      value: stats.trialTenants,
      icon: TrendingUp,
      gradient: 'orange',
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      gradient: 'blue',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <>
      <Header title="Dashboard" subtitle="Visão geral do sistema" />
      
      <div className={styles.content}>
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeContent}>
            <div className={styles.welcomeText}>
              <span className={styles.welcomeGreeting}>{getGreeting()}, Administrador!</span>
              <h2 className={styles.welcomeTitle}>Bem-vindo ao Grayskull Admin</h2>
              <p className={styles.welcomeDescription}>
                {stats.totalTenants > 0 
                  ? <>Você tem <strong>{stats.totalTenants} cliente{stats.totalTenants > 1 ? 's' : ''}</strong> cadastrado{stats.totalTenants > 1 ? 's' : ''}.</>
                  : 'Comece cadastrando seu primeiro cliente.'
                }
              </p>
            </div>
            <div className={styles.welcomeActions}>
              <a href="/tenants" className={styles.welcomeBtn}>
                <Plus size={18} />
                Novo Cliente
              </a>
            </div>
          </div>
          <div className={styles.welcomeDecoration}>
            <div className={styles.decorCircle1} />
            <div className={styles.decorCircle2} />
            <div className={styles.decorCircle3} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {statsCards.map((stat, index) => (
            <div 
              key={index} 
              className={`${styles.statCard} ${styles[`gradient${stat.gradient.charAt(0).toUpperCase() + stat.gradient.slice(1)}`]}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={styles.statTop}>
                <div className={styles.statIconBox}>
                  <stat.icon size={22} />
                </div>
                <div className={`${styles.statChange} ${stat.positive ? styles.positive : styles.negative}`}>
                  {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}%
                </div>
              </div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statTitle}>{stat.title}</div>
              <div className={styles.statBar}>
                <div 
                  className={styles.statBarFill} 
                  style={{ width: `${Math.min(stat.change * 3, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className={styles.chartsSection}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Crescimento de Clientes</h3>
                <p className={styles.chartSubtitle}>Histórico mensal</p>
              </div>
            </div>
            <GrowthChart data={[]} />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Receita Mensal</h3>
                <p className={styles.chartSubtitle}>Faturamento por mês</p>
              </div>
            </div>
            <RevenueChart data={[]} />
          </div>
        </div>

        {/* Recent Tenants */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderLeft}>
              <h3>Clientes Recentes</h3>
              <span className={styles.tableBadge}>{tenants.length} total</span>
            </div>
            <div className={styles.tableHeaderRight}>
              <button className={styles.tableFilterBtn}>
                <Filter size={16} />
                Filtrar
              </button>
              <a href="/tenants" className={styles.tableViewAll}>
                Ver todos
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>CNPJ</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className={styles.emptyState}>
                        <Building2 size={40} />
                        <p>Nenhum cliente cadastrado ainda</p>
                        <button className={styles.emptyBtn}>
                          <Plus size={16} />
                          Adicionar primeiro cliente
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tenants.slice(0, 5).map((tenant, index) => (
                    <tr key={tenant.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <td>
                        <div className={styles.tenantCell}>
                          <div className={styles.tenantAvatar}>
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.tenantInfo}>
                            <span className={styles.tenantName}>{tenant.name}</span>
                            <span className={styles.tenantEmail}>{tenant.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.monoText}>{tenant.document}</span>
                      </td>
                      <td>
                        <span className={styles.planBadge}>
                          {tenant.subscription?.plan?.name || 'Sem plano'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[tenant.status?.toLowerCase() || 'pending']}`}>
                          <span className={styles.statusDot} />
                          {tenant.status === 'ACTIVE' && 'Ativo'}
                          {tenant.status === 'TRIAL' && 'Trial'}
                          {tenant.status === 'PENDING' && 'Pendente'}
                          {tenant.status === 'SUSPENDED' && 'Suspenso'}
                          {!tenant.status && 'Pendente'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.dateText}>
                          {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td>
                        <button className={styles.rowMenuBtn}>
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
